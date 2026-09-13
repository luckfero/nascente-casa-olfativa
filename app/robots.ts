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
 *
 * E esta é a **única** casa dessa decisão desde 09/09/2026. Havia um
 * `app/sitemap.ts` ao lado, que respondia 200 em `/sitemap.xml` com um
 * `urlset` vazio de 110 bytes: um mapa que dizia "existo e não tenho nada
 * dentro", contradizendo em silêncio o que está escrito aqui. Ele foi
 * apagado, e agora `/sitemap.xml` simplesmente não existe. Uma decisão só,
 * escrita num lugar só. Quem um dia quiser mapa de verdade recria o arquivo,
 * e a primeira coisa a fazer é vir aqui contar o outro lado.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
