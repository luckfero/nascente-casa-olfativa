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
 *   Permissions    câmera, microfone e localização ficam desligados. O site
 *                  não pede nada disso; sem o cabeçalho, um script injetado
 *                  poderia pedir.
 *   COOP           isola a janela de quem a abriu, cortando acesso cruzado.
 */
const cabecalhosDeSeguranca: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  /* Um dia, de propósito, e não um ano.
     Quem memoriza esta ordem é o navegador do visitante, não o servidor:
     parar de enviar o cabeçalho **não** apaga a memória de quem já recebeu.
     Com um dia, um erro se resolve sozinho em 24h; com um ano, o visitante
     fica preso à regra por um ano. Subir o prazo é decisão consciente,
     depois de o redirecionamento estar comprovado em produção. */
  "Strict-Transport-Security": "max-age=86400",
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
        headers: { Location: url.toString(), "Strict-Transport-Security": "max-age=86400" },
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
