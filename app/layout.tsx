import type { Metadata } from "next";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/jost";
import "./tokens.css";
import "./base.css";
import "./shell.css";
import "./editorial.css";
import "./commerce.css";

/* Domínio próprio desde 2026-08-10. Sem valor padrão, `metadataBase` ficava
   indefinido e o canonical saía como caminho relativo — ambíguo, porque o
   mesmo caminho existe em qualquer host. */
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nascente.varandaestudioweb.com";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "Nascente — Casa Olfativa",
    template: "%s | Nascente",
  },
  description:
    "Perfumaria autoral para o corpo, a casa e os momentos entre os dois. Três coleções em colônias, cuidados e perfumação de ambiente.",
  /* `noindex` desde 2026-08-10, como a Nívora e o Brasa do Vale já eram.
     Este é um projeto conceitual: a Nascente não existe, e o site tem
     catálogo e fluxo de compra completos. Indexado, ele aparece na busca
     como uma loja real, e alguém pode tentar comprar de uma empresa que
     não existe. O protocolo proíbe alimentar buscador com dado inventado.

     Agrava-se por estar sob `varandaestudioweb.com`: seria conteúdo
     comercial fictício indexado sob o domínio de marca do estúdio. */
  robots: { index: false, follow: false },
  other: {
    "theme-color": "#191210",
  },
  openGraph: {
    title: "Nascente — Casa Olfativa",
    description:
      "Três coleções autorais para perfumar a pele, a casa e os momentos entre os dois.",
    type: "website",
    locale: "pt_BR",
    images: [
      {
        url: "/images/hq/hero-central-nascente.webp",
        width: 3344,
        height: 1882,
        alt: "Frasco Nascente em vidro âmbar entre folhas e bergamota",
      },
    ],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
