import handler from "vinext/server/app-router-entry";
import { isKnownRoute } from "../lib/routes";

/**
 * Corrige o código HTTP de caminhos inexistentes.
 *
 * A rota coringa `app/[...slug]` renderiza a página de erro, mas devolvia
 * 200 — um "soft 404": para um buscador é conteúdo válido, então endereços
 * que não existem acabam indexados. O caminho idiomático seria `notFound()`
 * com `app/not-found.tsx`, mas o vinext não aplica os metadados desse
 * arquivo (nem `metadata`, nem `generateMetadata`), o que fazia a página sair
 * com o título e o `robots` do layout. Aqui o `generateMetadata` da rota
 * coringa continua valendo e só o código é ajustado.
 */
interface WorkerHandler {
  fetch(request: Request, env: unknown, ctx: unknown): Promise<Response>;
}

/**
 * Cabeçalhos de segurança, aplicados a toda resposta.
 *
 * Nenhum deles muda o que a página faz — todos fecham porta que o site não
 * usa:
 *   nosniff        impede o navegador de adivinhar o tipo de um arquivo e
 *                  executar como script algo servido como texto ou imagem.
 *   DENY           o site não pode ser embutido em iframe de terceiro, que é
 *                  como se monta clickjacking.
 *   Referrer       ao sair para outro domínio vai só a origem, nunca o
 *                  caminho completo que a pessoa estava visitando.
 *   Permissions    câmera, microfone, localização, pagamento e USB ficam
 *                  desligados. O site não pede nada disso (o checkout é
 *                  simulado, sem campo financeiro); sem o cabeçalho, um
 *                  script injetado poderia pedir.
 *   COOP           isola a janela de quem a abriu, cortando acesso cruzado.
 *   CSP            em modo de observação: não bloqueia nada, só registra no
 *                  console do navegador o que violaria a política. Depois de
 *                  uma temporada assim, a chave vira `Content-Security-Policy`
 *                  e passa a valer de verdade. `'unsafe-inline'` é obrigatório
 *                  enquanto o vinext emitir script inline sem nonce.
 *
 * ANTES DE TIRAR O `-Report-Only`, LEIA ISTO. O código do site não carrega
 * nada de terceiro, mas a resposta que chega ao visitante carrega: medido em
 * 2026-09-09, toda requisição com `accept: text/html` volta de produção com um
 * `<script src="https://static.cloudflareinsights.com/beacon.min.js/...">` que
 * a borda injeta (Web Analytics, ligado no painel da Cloudflare, não neste
 * repositório; 5 medições em 5, e ausente quando o `accept` não pede HTML,
 * que é por que nenhuma auditoria por curl seco tinha visto).
 *
 * Os dois endereços da Cloudflare abaixo existem por causa disso, e a
 * liberação foi feita em 09/09/2026. Vale escrever o porquê, porque de fora
 * parece exceção arbitrária numa política que fora isso é `'self'` inteira:
 *
 *   - **Eles são da própria borda que hospeda o site.** Não são terceiro que
 *     alguém escolheu incluir: são a camada que responde antes do Worker.
 *   - **Entram em toda página sem passar por este repositório.** Ninguém vai
 *     encontrá-los lendo o código, e por isso ninguém ia lembrar deles na
 *     hora de fechar a política.
 *   - **Sem estas duas linhas, a política derruba a analítica sem avisar.**
 *     O script é barrado por `script-src` e o envio dele por `connect-src`,
 *     em silêncio: os números simplesmente param de chegar, e a única pista
 *     é uma linha no console de quem por acaso estiver com ele aberto.
 *
 * A política continua em `-Report-Only` de propósito. **Promover para
 * `Content-Security-Policy` não é decisão deste arquivo hoje**: primeiro
 * publica-se, olha-se o console em produção por uma temporada, e só então se
 * fecha. Enquanto for observação, nada quebra e a violação só é registrada,
 * que é exatamente o sinal que a temporada existe para dar.
 */
const CSP_EM_OBSERVACAO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/* `upgrade-insecure-requests` SAIU daqui em 09/09/2026, e volta junto com a
   promoção da política.

   Medido no console do Chrome: "The Content Security Policy directive
   upgrade-insecure-requests is ignored when delivered in a report-only
   policy". Em modo relatório ela não faz absolutamente nada, e ainda escreve
   um erro a cada carregamento de página. Isso atrapalha justamente a
   conferência que autoriza promover a política, que é abrir o console e não
   achar violação: com esta linha, toda página já começa com uma. Deixá-la
   aqui é pagar ruído por zero proteção.

   Quando o cabeçalho virar `Content-Security-Policy` sem `-Report-Only`, ela
   entra de volta na mesma linha. */
const cabecalhosDeSeguranca: Record<string, string> = {
  "Content-Security-Policy-Report-Only": CSP_EM_OBSERVACAO,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  /* Um ano. Começou em um dia, em 2026-08-10, de propósito: quem memoriza
     esta ordem é o navegador do visitante, não o servidor, e parar de enviar
     o cabeçalho **não** apaga a memória de quem já recebeu. O prazo curto era
     rede de segurança enquanto o redirecionamento não estava comprovado.

     Subiu para um ano em 2026-08-17, depois de uma semana no ar e de 20 em 20
     amostras dos quatro sites respondendo 301 em HTTP puro e 200 em HTTPS.

     Sem `includeSubDomains` e sem `preload`, e as duas ausências são decisão.
     O primeiro estenderia a regra a todo subdomínio abaixo deste host,
     inclusive os que ainda não existem. O segundo é irreversível na prática:
     sai de uma lista embutida no navegador, não de um cabeçalho que a gente
     controla, e voltar atrás leva meses. */
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function comSeguranca(response: Response, status?: number): Response {
  /* Passar o corpo adiante sem ler preserva o streaming da renderização. */
  const saida = new Response(response.body, {
    status: status ?? response.status,
    statusText: status === 404 ? "Not Found" : response.statusText,
    headers: response.headers,
  });
  for (const [nome, valor] of Object.entries(cabecalhosDeSeguranca)) {
    saida.headers.set(nome, valor);
  }
  return saida;
}

/**
 * Descobre se a requisição chegou sem criptografia.
 *
 * Duas fontes porque errar aqui derruba o site: dizer "é http" numa
 * requisição que já é HTTPS faz o worker redirecionar para um endereço que
 * ele vai julgar http de novo — laço infinito, site fora do ar.
 *
 * `CF-Visitor` tem prioridade sobre o endereço: numa borda que já terminou o
 * TLS, a URL chega como https mesmo quando o visitante veio de http.
 *
 * `localhost` fica **de fora**, e não é detalhe: o desenvolvimento e os
 * testes chamam o worker por `http://localhost`. Sem esta saída, todo
 * `npm run dev` viraria redirecionamento para um HTTPS inexistente.
 */
const HOSTS_LOCAIS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

function chegouSemCriptografia(request: Request, url: URL): boolean {
  if (HOSTS_LOCAIS.has(url.hostname) || url.hostname.endsWith(".local")) return false;

  const visitor = request.headers.get("CF-Visitor");
  if (visitor) {
    try {
      return JSON.parse(visitor).scheme === "http";
    } catch {
      /* Cabeçalho ilegível: cai para o endereço, abaixo. */
    }
  }
  return url.protocol === "http:";
}

const upstream = handler as unknown as WorkerHandler;

const worker: WorkerHandler = {
  async fetch(request, env, ctx) {
    /* Antes de qualquer coisa: HTTP puro não entrega página.
       Sem isto o site respondia 200 em texto aberto — HTML inteiro numa
       conexão que qualquer um na mesma rede lê e altera. O HSTS acima só
       protege da segunda visita em diante; esta é a primeira. */
    const url = new URL(request.url);
    if (chegouSemCriptografia(request, url)) {
      url.protocol = "https:";
      return new Response(null, {
        status: 301,
        headers: { Location: url.toString(), "Strict-Transport-Security": "max-age=31536000" },
      });
    }

    const response = await upstream.fetch(request, env, ctx);

    const ehHtml = response.headers.get("content-type")?.startsWith("text/html");
    if (response.status === 200 && ehHtml) {
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0 && !isKnownRoute(segments)) {
        return comSeguranca(response, 404);
      }
    }

    return comSeguranca(response);
  },
};

export default worker;
