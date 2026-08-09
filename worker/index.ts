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

const upstream = handler as unknown as WorkerHandler;

const worker: WorkerHandler = {
  async fetch(request, env, ctx) {
    const response = await upstream.fetch(request, env, ctx);

    const ehHtml = response.headers.get("content-type")?.startsWith("text/html");
    if (response.status === 200 && ehHtml) {
      const segments = new URL(request.url).pathname.split("/").filter(Boolean);
      if (segments.length > 0 && !isKnownRoute(segments)) {
        return comSeguranca(response, 404);
      }
    }

    return comSeguranca(response);
  },
};

export default worker;
