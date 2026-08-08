/**
 * Monta as fontes responsivas geradas por scripts/optimize-images.mjs.
 *
 * As variantes vivem em /images/r/<nome>-<largura>.<avif|webp>; o arquivo
 * original em /images/hq/ permanece como último recurso, então uma variante
 * ausente degrada para a imagem cheia em vez de quebrar.
 */

export const IMAGE_WIDTHS = [400, 800, 1200, 1600] as const;

/** "/images/hq/colonia-chuva-clara.webp" → "colonia-chuva-clara" */
export function imageName(src: string): string {
  return src.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "";
}

function srcSet(name: string, format: "avif" | "webp"): string {
  return IMAGE_WIDTHS.map((w) => `/images/r/${name}-${w}.${format} ${w}w`).join(", ");
}

export interface PictureSources {
  avif: string;
  webp: string;
  fallback: string;
  name: string;
}

export function pictureSources(src: string): PictureSources {
  const name = imageName(src);
  return {
    name,
    avif: srcSet(name, "avif"),
    webp: srcSet(name, "webp"),
    fallback: src,
  };
}

/**
 * Larguras nomeadas por contexto de uso. Manter os `sizes` centralizados evita
 * o erro clássico de declarar um valor que não corresponde ao layout real —
 * o que faz o navegador baixar a variante errada.
 */
export const SIZES = {
  /** Ocupa a largura toda da viewport. */
  full: "100vw",
  /** Cartão em grade de 4 colunas dentro do container. */
  card: "(max-width: 680px) 50vw, (max-width: 1040px) 33vw, 22vw",
  /** Cartão de coleção, 3 colunas. */
  collection: "(max-width: 960px) 92vw, 30vw",
  /** Metade da tela em blocos editoriais. */
  half: "(max-width: 960px) 100vw, 52vw",
  /** Imagem principal da página de produto. */
  product: "(max-width: 900px) 100vw, 54vw",
  /** Miniatura da sacola. */
  thumb: "72px",
} as const;
