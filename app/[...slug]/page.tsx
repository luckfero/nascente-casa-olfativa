import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Storefront from "@/components/storefront";
import { collectionBySlug, productBySlug } from "@/lib/catalog";
import { isKnownRoute } from "@/lib/routes";

const routeTitles: Record<string, { title: string; description: string }> = {
  produtos: {
    title: "Produtos",
    description:
      "Catálogo Nascente de perfumaria, produtos para o corpo, casa e presentes.",
  },
  colecoes: {
    title: "Coleções",
    description:
      "Conheça Chuva Clara, Folha Quente e Sol de Dentro.",
  },
  "guia-olfativo": {
    title: "Guia Olfativo",
    description: "Encontre uma coleção por sensação, família e ocasião.",
  },
  sobre: {
    title: "A Nascente",
    description: "Conheça a história e o modo de criar da Nascente.",
  },
  ajuda: {
    title: "Central de Ajuda",
    description:
      "Respostas sobre fragrâncias, presentes, entregas e trocas.",
  },
  "entregas-e-trocas": {
    title: "Central de Ajuda",
    description:
      "Respostas sobre fragrâncias, presentes, entregas e trocas.",
  },
  contato: {
    title: "Contato",
    description: "Entre em contato com o atendimento Nascente.",
  },
  sacola: {
    title: "Sacola",
    description: "Revise os produtos escolhidos.",
  },
  checkout: {
    title: "Checkout",
    description: "Revise a experiência de compra Nascente.",
  },
  privacidade: {
    title: "Privacidade e termos",
    description:
      "Política de privacidade e condições de uso da experiência Nascente.",
  },
  termos: {
    title: "Privacidade e termos",
    description:
      "Política de privacidade e condições de uso da experiência Nascente.",
  },
  politicas: {
    title: "Privacidade e termos",
    description:
      "Política de privacidade e condições de uso da experiência Nascente.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug[0] === "produtos" && slug[1]) {
    const product = productBySlug(slug[1]);
    if (product) {
      return {
        title: product.name,
        description: product.description,
      };
    }
  }
  if (slug[0] === "colecoes" && slug[1]) {
    const collection = collectionBySlug(slug[1]);
    if (collection) {
      return {
        title: collection.name,
        description: collection.description,
      };
    }
  }
  const meta = routeTitles[slug.join("/")] ?? {
    title: "Página não encontrada",
    description: "O caminho solicitado não foi encontrado.",
  };
  return meta;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  /* Caminho inexistente sai daqui com 404 de verdade, renderizando
     `app/not-found.tsx`. Antes o storefront devolvia a página de erro
     dentro de uma resposta 200. */
  if (!isKnownRoute(slug)) notFound();

  return <Storefront route={slug} />;
}
