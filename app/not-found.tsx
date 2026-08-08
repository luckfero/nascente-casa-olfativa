import type { Metadata } from "next";
import Storefront from "@/components/storefront";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "O caminho solicitado não foi encontrado.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  /* Um caminho que a cadeia do storefront não reconhece cai no ramo final
     e rende a página de erro com cabeçalho e rodapé — a mesma casca do
     resto do site, sem duplicar nada aqui. */
  return <Storefront route={["nao-encontrado"]} />;
}
