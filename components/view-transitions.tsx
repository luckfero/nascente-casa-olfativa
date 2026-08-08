"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Transição entre páginas usando a View Transitions API.
 *
 * O Brasa do Vale consegue o mesmo efeito só com CSS (`@view-transition
 * { navigation: auto }`) porque navega com `<a href>` comum — o navegador
 * troca o documento inteiro e cuida da animação sozinho. Aqui a navegação
 * é do `next/link`, que troca a tela por JavaScript sem recarregar: o
 * navegador nunca vê uma navegação de documento, então a regra de CSS
 * jamais dispara. A transição precisa ser aberta à mão.
 *
 * O detalhe que faz funcionar: `startViewTransition` tira uma foto da
 * tela, roda o callback, espera a promessa dele e só então tira a segunda
 * foto. Como o `router.push` retorna antes de o React ter renderizado a
 * página nova, a promessa fica pendurada até o `pathname` mudar de fato —
 * é isso que o `resolver` abaixo faz. Sem essa espera, as duas fotos
 * sairiam iguais e não haveria animação nenhuma.
 */
export default function ViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const resolver = useRef<(() => void) | null>(null);

  /* Chegou a página nova: libera a segunda foto. */
  useEffect(() => {
    resolver.current?.();
    resolver.current = null;
  }, [pathname]);

  useEffect(() => {
    if (typeof document.startViewTransition !== "function") return;

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const destino = new URL(anchor.href, location.href);
      if (destino.origin !== location.origin) return;
      /* Âncora dentro da mesma página não é troca de página. */
      if (destino.pathname === location.pathname && destino.search === location.search) return;

      /* Quem pediu menos movimento navega direto, sem animação. */
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      event.preventDefault();
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            resolver.current = resolve;
            router.push(destino.pathname + destino.search);

            /* Rede de segurança: se a rota travar ou o destino repetir o
               `pathname` atual, o efeito acima nunca roda e a tela ficaria
               congelada sob a foto da transição. */
            window.setTimeout(() => {
              resolver.current?.();
              resolver.current = null;
            }, 1200);
          }),
      );
    }

    /* Fase de captura, e isso é essencial. Na fase de borbulha o handler do
       `next/link` já teria rodado e chamado `preventDefault`, e este código
       sairia fora sem nunca abrir a transição.
       Capturando antes, o `preventDefault` daqui faz o Link desistir de
       navegar — ele checa `defaultPrevented` — mas só depois de já ter
       chamado o `onClick` que o componente passou, então coisas como
       fechar o menu continuam funcionando. */
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
