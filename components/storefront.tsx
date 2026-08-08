"use client";

import { type ReactNode } from "react";
import { collectionBySlug, productBySlug } from "@/lib/catalog";
import { CartProvider } from "./cart";
import { CartDrawer, Footer, Header } from "./shell";
import ViewTransitions from "./view-transitions";
import { HomePage } from "./page-home";
import { CatalogPage, CollectionPage, CollectionsPage } from "./page-catalog";
import { ProductPage } from "./page-product";
import { BagPage, CheckoutPage } from "./page-checkout";
import { GuidePage } from "./page-guide";
import {
  AboutPage,
  ContactPage,
  HelpPage,
  NotFoundPage,
  PoliciesPage,
  ShippingPage,
} from "./page-content";

/** Páginas cujo topo é uma imagem sangrada — o cabeçalho começa transparente. */
const OVER_MEDIA = new Set(["", "sobre"]);

export default function Storefront({ route }: { route: string[] }) {
  const key = route.join("/");
  const path = `/${key}`;

  let page: ReactNode;
  let overMedia = OVER_MEDIA.has(key);

  if (!key) page = <HomePage />;
  else if (key === "produtos") page = <CatalogPage />;
  else if (key === "colecoes") page = <CollectionsPage />;
  else if (key === "guia-olfativo") page = <GuidePage />;
  else if (key === "sobre") page = <AboutPage />;
  else if (key === "ajuda") page = <HelpPage />;
  else if (key === "entregas-e-trocas") page = <ShippingPage />;
  else if (key === "contato") page = <ContactPage />;
  else if (key === "sacola") page = <BagPage />;
  else if (key === "checkout") page = <CheckoutPage />;
  else if (["politicas", "privacidade", "termos"].includes(key)) page = <PoliciesPage />;
  else if (route[0] === "produtos" && route[1]) {
    const product = productBySlug(route[1]);
    page = product ? <ProductPage product={product} /> : <NotFoundPage />;
  } else if (route[0] === "colecoes" && route[1]) {
    const collection = collectionBySlug(route[1]);
    if (collection) {
      page = <CollectionPage collection={collection} />;
      overMedia = true;
    } else {
      page = <NotFoundPage />;
    }
  } else page = <NotFoundPage />;

  /* O checkout dispensa cabeçalho e rodapé: menos saídas, menos abandono. */
  const bare = key === "checkout";

  return (
    <CartProvider>
      <ViewTransitions />
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>

      {!bare && <Header overMedia={overMedia} path={path} />}

      {page}

      {!bare && <Footer />}
      <CartDrawer />
    </CartProvider>
  );
}
