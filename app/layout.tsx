import type { Metadata } from "next";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/jost";
import "./tokens.css";
import "./base.css";
import "./shell.css";
import "./editorial.css";
import "./commerce.css";
import "./barra-rolagem.css";

/* Domínio próprio desde 2026-08-10. Sem valor padrão, `metadataBase` ficava
   indefinido e o canonical saía como caminho relativo — ambíguo, porque o
   mesmo caminho existe em qualquer host. */
const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nascente.varandaestudioweb.com";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "Nascente | Casa Olfativa",
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
    title: "Nascente | Casa Olfativa",
    description:
      "Três coleções autorais para perfumar a pele, a casa e os momentos entre os dois.",
    type: "website",
    locale: "pt_BR",
    /* O cartão de link é peça JPEG própria, e não a foto de origem.

       Antes daqui saía `/images/hq/hero-central-nascente.webp`: 326.766 bytes
       e 3344x1882, servindo ao mesmo tempo de fundo da hero e de cartão. Duas
       coisas erradas nisso. A primeira é o tamanho: quem monta o cartão pede
       1200x630, e mandar uma foto quase três vezes mais larga é atravessar a
       rede com bytes que ninguém vê. A segunda é o formato, e é a que decide:
       **não há como medir daqui como WhatsApp e LinkedIn tratam WebP na
       prévia.** Diante de dúvida que não se resolve por medição, vale o
       formato que todos aceitam sem discussão, que é JPEG.

       A peça é recorte central da mesma foto, no mesmo enquadramento: corte de
       3344x1756 (a altura que dá a proporção 1200:630) e redução para 1200x630.
       Regerar com

         ffmpeg -y -i public/images/hq/hero-central-nascente.webp \
           -vf "crop=3344:1756,scale=1200:630:flags=lanczos" \
           -frames:v 1 -q:v 3 public/images/og/cartao-1200x630.jpg

       A WebP continua onde sempre esteve, servindo a página.

       Conferência é por BYTES, nunca pelo código HTTP (regra 9.30): assinatura
       `FF D8 FF`, marcador SOF com 1200x630 e corpo acima de alguns KB. Rota
       de imagem que responde não é o mesmo que imagem que existe. */
    images: [
      {
        url: "/images/og/cartao-1200x630.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Frasco Nascente em vidro âmbar entre folhas e bergamota",
      },
    ],
  },
  icons: {
    /* O `?v=` não é enfeite. O navegador guarda favicon num índice próprio,
       fora do cache HTTP normal, e ignora `must-revalidate`: quem já visitou
       continua vendo o ícone antigo mesmo com Ctrl+F5. Mudar o endereço é o
       que força a busca.

       **Trocar o desenho sem subir este número não chega em ninguém que já
       esteve aqui.** v2 = meia rodela de cítrico, 2026-08-11. */
    icon: "/favicon.svg?v=2",
    shortcut: "/favicon.svg?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {/* Tem que rodar antes da primeira pintura: se a barra nativa sumir
            depois, a página dá um pulo da largura dela. E é por classe de
            propósito — sem JavaScript ela não entra e o visitante fica com a
            barra nativa. Nunca existe página sem forma de rolar. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('tem-js')" }} />
        {children}
        <script src="/barra-rolagem.js" defer />
      </body>
    </html>
  );
}
