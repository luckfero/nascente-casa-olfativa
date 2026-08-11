import type { MetadataRoute } from "next";

/**
 * Projeto conceitual: nada aqui deve ser rastreado.
 *
 * A meta tag `robots` do layout já diz `noindex`, mas ela só age depois que
 * o rastreador busca a página. O `Disallow` evita a visita, e os dois juntos
 * são o que fecha de verdade.
 *
 * Sem `sitemap`: apontar um mapa de páginas que o robô não deve visitar é
 * contraditório, e alguns rastreadores seguem o sitemap mesmo assim.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
