import { collectionBySlug, productBySlug } from "./catalog";

/**
 * Quais caminhos existem de fato.
 *
 * O roteamento visual vive em `components/storefront.tsx`, que é um
 * componente de cliente e por isso não pode decidir o código HTTP. Esta
 * lista existe para que o servidor possa responder 404 de verdade em vez
 * de devolver 200 com a página de erro dentro — um "soft 404", que faz
 * buscadores indexarem endereços inexistentes.
 *
 * Precisa acompanhar a cadeia de rotas do storefront. O teste
 * `tests/rendered-html.test.mjs` percorre todos estes caminhos e cobra
 * 200 em cada um, então uma divergência aparece na hora.
 */
export const STATIC_ROUTES: readonly string[] = [
  "produtos",
  "colecoes",
  "guia-olfativo",
  "sobre",
  "ajuda",
  "entregas-e-trocas",
  "contato",
  "sacola",
  "checkout",
  "politicas",
  "privacidade",
  "termos",
];

export function isKnownRoute(slug: string[]): boolean {
  const key = slug.join("/");
  if (STATIC_ROUTES.includes(key)) return true;

  /* Só o par exato `produtos/<slug>` — `produtos/x/y` não existe. */
  if (slug.length === 2 && slug[0] === "produtos") {
    return Boolean(productBySlug(slug[1]));
  }
  if (slug.length === 2 && slug[0] === "colecoes") {
    return Boolean(collectionBySlug(slug[1]));
  }
  return false;
}
