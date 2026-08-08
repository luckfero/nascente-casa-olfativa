import type { Metadata } from "next";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/jost";
import "./tokens.css";
import "./base.css";
import "./shell.css";
import "./editorial.css";
import "./commerce.css";

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: publicSiteUrl ? new URL(publicSiteUrl) : undefined,
  title: {
    default: "Nascente — Casa Olfativa",
    template: "%s | Nascente",
  },
  description:
    "Perfumaria autoral para o corpo, a casa e os momentos entre os dois. Três coleções em colônias, cuidados e perfumação de ambiente.",
  robots: { index: true, follow: true },
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
