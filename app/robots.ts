import type { MetadataRoute } from "next";

/**
 * Projeto conceitual: não deve ser indexado. Quem faz isso é o `noindex` do
 * layout, e **não** um `Disallow` aqui.
 *
 * A distinção é contraintuitiva e custou uma correção. `Disallow` impede o
 * rastreador de buscar a página; sem buscar, ele nunca lê a meta tag
 * `noindex`. O endereço então continua elegível para aparecer na busca, só
 * que sem conteúdo, a partir de qualquer link externo. As duas instruções
 * juntas se anulam.
 *
 * Para tirar da busca de verdade: liberar o acesso aqui e negar a indexação
 * na página. É o que a Nívora e o Brasa do Vale já faziam.
 *
 * Sem `sitemap`: um mapa de páginas que não devem ser indexadas não tem
 * função, e ainda convida o rastreador a percorrer o catálogo inteiro.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
