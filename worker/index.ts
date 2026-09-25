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
 *   CSP            valendo desde 25/09/2026: o navegador bloqueia o que a
 *                  política não lista. `'unsafe-inline'` em `script-src` é
 *                  obrigatório enquanto o vinext emitir script inline sem
 *                  nonce, e por isso ela não segura script inline injetado.
 *                  O que ela fecha é `object-src`, `base-uri`, `form-action`,
 *                  `frame-ancestors` e a lista de hosts de onde vem script,
 *                  imagem, fonte e conexão.
 *
 * ANTES DE MEXER NA POLÍTICA, LEIA ISTO. O código do site não carrega nada de
 * terceiro, mas a resposta que chega ao visitante carrega: medido em
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
 *     hora de mexer na política.
 *   - **Sem o endereço em `script-src`, a política derruba a analítica sem
 *     avisar.** O `beacon.min.js` é barrado e os números simplesmente param
 *     de chegar; a única pista é uma linha no console de quem por acaso
 *     estiver com ele aberto.
 *
 * Para onde o beacon ENVIA é outra conversa, e foi aqui que este comentário
 * esteve errado até 25/09/2026, quando dizia que o envio seria barrado por
 * `connect-src`. Não seria. O `data-cf-beacon` injetado traz
 * `"version":"2024.11.0"`, e com versão o beacon manda para `/cdn-cgi/rum` da
 * PRÓPRIA origem (XHR e sendBeacon), que o `'self'` já cobre. Conferido no
 * `beacon.min.js` e medido nos dois motores: nenhuma requisição foi para
 * `cloudflareinsights.com`. Esse endereço só seria usado por um snippet sem
 * `version`, que envia para `https://cloudflareinsights.com/cdn-cgi/rum`. Ele
 * fica em `connect-src` como seguro barato: se a borda trocar o snippet, a
 * analítica continua chegando.
 *
 * A política passou por `-Report-Only` de 09/09 a 25/09/2026 e foi promovida
 * depois de medida em produção, em Chromium e WebKit, desktop e celular, com
 * catálogo, filtros, sacola, checkout, guia e 404 exercitados: zero violação
 * do site, também com o cabeçalho trocado para valer no navegador de medição.
 * Ficar mais tempo em relatório não traria nada: sem `report-to` nem
 * `report-uri`, o modo relatório não coleta violação de visitante nenhum, e o
 * WebKit ainda escrevia em toda página um erro avisando que a política
 * "will have no effect".
 *
 * Agora ela BLOQUEIA. Se o painel da Cloudflare ligar outra injeção de borda
 * (Rocket Loader, Zaraz, Turnstile de `challenges.cloudflare.com`) ou trocar
 * o snippet do Web Analytics, a política precisa ser revista antes, porque o
 * que ela não listar deixa de carregar.
 */
const POLITICA_DE_CONTEUDO = [
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
  "upgrade-insecure-requests",
].join("; ");

/* `upgrade-insecure-requests` ficou de fora de 09/09 a 25/09/2026, enquanto a
   política era `-Report-Only`. Medido no console do Chrome: "The Content
   Security Policy directive upgrade-insecure-requests is ignored when
   delivered in a report-only policy". Em modo relatório ela não fazia nada e
   ainda escrevia um erro a cada carregamento, atrapalhando justamente a
   conferência que autorizou a promoção.

   Voltou junto com o `Content-Security-Policy`, que é onde ela age: um
   endereço `http://` que escape para dentro de uma página passa a ser pedido
   em `https://`, em vez de virar conteúdo misto. Medida antes de voltar,
   nos dois motores e com A/B no WebKit com e sem ela: nenhum efeito
   colateral, porque hoje o site não pede nada por `http://`. */
const cabecalhosDeSeguranca: Record<string, string> = {
  "Content-Security-Policy": POLITICA_DE_CONTEUDO,
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
