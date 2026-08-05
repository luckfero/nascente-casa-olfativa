import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./globals.css";
import "./centered.css";
import "./luxury.css";

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  metadataBase: publicSiteUrl ? new URL(publicSiteUrl) : undefined,
  title: {
    default: "Nascente — Casa Olfativa",
    template: "%s | Nascente",
  },
  description:
    "Perfumaria autoral para o corpo, a casa e os momentos entre os dois.",
  robots: { index: true, follow: true },
  other: {
    "theme-color": "#4A1423",
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
        alt: "Perfume Nascente centralizado em composição botânica",
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
