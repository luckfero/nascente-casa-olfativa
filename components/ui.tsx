"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pictureSources, SIZES } from "@/lib/images";

/* ---------------------------------------------------------------- imagem -- */

interface PictureProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Serve AVIF → WebP → original. O `alt` é obrigatório por tipo: imagem
 * decorativa passa string vazia de propósito, nunca por esquecimento.
 */
export function Picture({ src, alt, sizes = SIZES.card, priority, className }: PictureProps) {
  const { avif, webp, fallback } = pictureSources(src);
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      <img
        src={fallback}
        alt={alt}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}

/* -------------------------------------------------------------- revelação -- */

/** useLayoutEffect não existe no servidor; lá o efeito simplesmente não roda. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Revela ao entrar na viewport, uma única vez.
 *
 * O elemento só entra no estado animável dentro do useLayoutEffect — antes da
 * primeira pintura e depois da hidratação. Assim o HTML do servidor e o do
 * cliente são idênticos (nada de mismatch), e um navegador sem JS ou sem
 * IntersectionObserver simplesmente mostra o conteúdo.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "ol";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;

    node.dataset.reveal = "pending";

    let heardFromObserver = false;

    const observer = new IntersectionObserver(
      (entries) => {
        heardFromObserver = true;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    observer.observe(node);

    /* Rede de segurança. Um IntersectionObserver saudável emite um primeiro
       callback quase imediatamente; se nada chegou, o ambiente não está
       entregando esses eventos (aba em segundo plano que nunca pintou, motor
       embutido, extensão). Nesse caso desistimos da animação e mostramos o
       conteúdo — nenhum efeito vale uma seção invisível. */
    const failsafe = window.setTimeout(() => {
      if (!heardFromObserver) {
        node.classList.add("is-revealed");
        observer.disconnect();
      }
    }, 1000);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>

  );
}

/* -------------------------------------------------------------- controles -- */

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Diminuir quantidade de ${label}`}
      >
        −
      </button>
      <output aria-label={`Quantidade de ${label}`}>{value}</output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Aumentar quantidade de ${label}`}
      >
        +
      </button>
    </div>
  );
}

const INTENSITY_WORDS: Record<number, string> = {
  1: "Muito suave",
  2: "Suave",
  3: "Média",
  4: "Marcante",
  5: "Intensa",
};

export function Intensity({ level }: { level: number }) {
  return (
    <div className="intensity">
      <span
        className="intensity__track"
        role="img"
        aria-label={`Intensidade ${level} de 5 — ${INTENSITY_WORDS[level] ?? ""}`}
      >
        {[1, 2, 3, 4, 5].map((step) => (
          <i key={step} data-on={step <= level} />
        ))}
      </span>
      <span style={{ fontSize: "var(--t-xs)", color: "var(--ink-faint)" }}>
        {INTENSITY_WORDS[level] ?? `${level} de 5`}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------- utilidades -- */

/** Trava o scroll do fundo enquanto gaveta/overlay está aberto. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/**
 * Mantém o foco dentro do painel enquanto ele estiver aberto e devolve o foco
 * ao elemento que o abriu ao fechar — o comportamento que um diálogo precisa
 * ter para ser navegável por teclado.
 */
export function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    const opener = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        container?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [active, onClose]);

  return ref;
}

/**
 * Progresso de rolagem de 0 a 1 sobre a altura do primeiro `.hero` da página.
 *
 * Devolve 0 no topo e 1 exatamente quando a fotografia do hero saiu de vista —
 * é isso que permite ao cabeçalho clarear aos poucos em vez de trocar de
 * estado num limiar. Em páginas sem hero o valor vira 1 de imediato, e o
 * cabeçalho já nasce opaco.
 */
export function useHeroProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero, .quiz-result");
    if (!hero) {
      /* Fora do corpo síncrono do efeito para não encadear um segundo render
         dentro do mesmo commit. */
      queueMicrotask(() => setProgress(1));
      return;
    }

    let frame = 0;
    const measure = () => {
      /* A referência é a altura do hero menos a do próprio cabeçalho: quando
         a última faixa útil da imagem passa por baixo dele, já é 1. */
      const headerHeight = document.querySelector<HTMLElement>(".header")?.offsetHeight ?? 0;
      const span = Math.max(1, hero.offsetHeight - headerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / span)));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    queueMicrotask(measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return progress;
}
