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

const upstream = handler as unknown as WorkerHandler;

const worker: WorkerHandler = {
  async fetch(request, env, ctx) {
    const response = await upstream.fetch(request, env, ctx);

    if (response.status !== 200) return response;
    if (!response.headers.get("content-type")?.startsWith("text/html")) return response;

    const segments = new URL(request.url).pathname.split("/").filter(Boolean);
    if (segments.length === 0 || isKnownRoute(segments)) return response;

    /* Repassar o corpo como está preserva o streaming da renderização. */
    return new Response(response.body, {
      status: 404,
      statusText: "Not Found",
      headers: response.headers,
    });
  },
};

export default worker;
