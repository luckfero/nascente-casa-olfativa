"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { money } from "@/lib/catalog";
import { SIZES } from "@/lib/images";
import { FREE_SHIPPING_FROM } from "@/lib/shipping";
import { useCart, GIFT_WRAP_PRICE } from "./cart";
import { Picture, Stepper, useFocusTrap, useHeroProgress, useScrollLock } from "./ui";

const NAV = [
  { href: "/produtos", label: "Loja" },
  { href: "/colecoes", label: "Coleções" },
  { href: "/guia-olfativo", label: "Guia olfativo" },
  { href: "/sobre", label: "A casa" },
];

/* ------------------------------------------------------------- cabeçalho -- */

export function Header({ overMedia, path }: { overMedia: boolean; path: string }) {
  const { count, setOpen } = useCart();
  const router = useRouter();
  const progress = useHeroProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useScrollLock(menuOpen);

  /* Fora de páginas com hero o cabeçalho já nasce opaco. */
  const p = overMedia ? progress : 1;

  /* Um único caminho para o mesmo botão: fechado, ele abre o campo; aberto,
     ele busca. O `type` do botão nunca muda — quando mudava, o React aplicava
     o novo estado antes de o navegador resolver a ação padrão do clique, e o
     mesmo gesto que abria o campo já disparava o envio do formulário. */
  function submitSearch(event: FormEvent) {
    event.preventDefault();

    if (!searchOpen) {
      setSearchOpen(true);
      window.setTimeout(() => searchRef.current?.focus(), 220);
      return;
    }

    const query = term.trim();
    if (!query) {
      searchRef.current?.focus();
      return;
    }
    router.push(`/produtos?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  }

  return (
    <>
      <header
        className={["header", overMedia ? "header--over-media" : ""].filter(Boolean).join(" ")}
        style={{ ["--p" as string]: p }}
      >
        <button
          type="button"
          className="icon-btn menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="nav-principal"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="visually-hidden">{menuOpen ? "Fechar menu" : "Abrir menu"}</span>
          <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
            <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>

        <nav id="nav-principal" className="header__nav" data-open={menuOpen} aria-label="Navegação principal">
          <ul>
            {NAV.map((link) => (
              <li key={link.href}>
                {/* Fechar no clique é mais direto que reagir à mudança de rota
                    num efeito — e evita um render extra a cada navegação. */}
                <Link
                  href={link.href}
                  aria-current={path.startsWith(link.href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/" className="header__brand">
          Nascente
        </Link>

        <div className="header__actions">
          {/* A busca se abre na própria barra: o campo cresce a partir da lupa
              em vez de cobrir a página com uma camada. */}
          <form
            className="header__search"
            data-open={searchOpen}
            role="search"
            onSubmit={submitSearch}
          >
            <label htmlFor="busca-topo" className="visually-hidden">
              Buscar por fragrância, produto ou nota
            </label>
            <input
              id="busca-topo"
              ref={searchRef}
              type="search"
              placeholder="Bergamota, vela, presente…"
              value={term}
              tabIndex={searchOpen ? 0 : -1}
              aria-hidden={!searchOpen}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
              }}
            />
            <button
              type="submit"
              className="icon-btn"
              aria-label={searchOpen ? "Buscar" : "Abrir busca"}
              aria-expanded={searchOpen}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 12l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </form>

          <button
            type="button"
            className="icon-btn bag-btn"
            onClick={() => setOpen(true)}
            aria-label={count > 0 ? `Sacola com ${count} ${count === 1 ? "item" : "itens"}` : "Sacola vazia"}
          >
            <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden="true">
              <path d="M4 6h11l-.9 10a1 1 0 0 1-1 .9H5.9a1 1 0 0 1-1-.9L4 6Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 6V4.6a2.5 2.5 0 0 1 5 0V6" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            {count > 0 && <span className="bag-btn__count" aria-hidden="true">{count}</span>}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          className="drawer-scrim"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

    </>
  );
}

/* ------------------------------------------------------- gaveta da sacola -- */

export function CartDrawer() {
  const { open, setOpen, resolved, subtotal, setQuantity, remove, setGift } = useCart();
  const close = () => setOpen(false);
  const trapRef = useFocusTrap(open, close);
  useScrollLock(open);

  if (!open) return null;

  const missing = Math.max(0, FREE_SHIPPING_FROM - subtotal);

  return (
    <>
      <div className="drawer-scrim" onClick={close} aria-hidden="true" />
      <aside className="drawer" ref={trapRef} role="dialog" aria-modal="true" aria-label="Sacola">
        <div className="drawer__head">
          <h2>Sacola</h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Fechar sacola">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        <div className="drawer__body">
          {resolved.length === 0 ? (
            <div className="drawer__empty">
              <p>Sua sacola está vazia.</p>
              <Link href="/produtos" className="btn btn--ghost" onClick={close}>
                <span>Ver a loja</span>
              </Link>
            </div>
          ) : (
            <ul>
              {resolved.map((item) => (
                <li className="bag-line" key={item.key}>
                  <div className="bag-line__media">
                    <Picture src={item.product.image} alt="" sizes={SIZES.thumb} />
                  </div>
                  <div>
                    <p className="bag-line__name">{item.product.name}</p>
                    <p className="bag-line__meta">
                      {item.size}
                      {item.gift ? " · embrulho para presente" : ""}
                    </p>
                    {!item.available && (
                      <p className="bag-line__meta" style={{ color: "var(--state-error)" }}>
                        Indisponível neste tamanho
                      </p>
                    )}
                    <label className="bag-line__meta" style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.4rem" }}>
                      <input
                        type="checkbox"
                        checked={item.gift}
                        onChange={(event) => setGift(item.key, event.target.checked)}
                      />
                      Embrulho (+{money(GIFT_WRAP_PRICE)})
                    </label>
                    <div className="bag-line__foot">
                      <Stepper
                        value={item.quantity}
                        onChange={(next) => setQuantity(item.key, next)}
                        label={item.product.name}
                      />
                      <span className="bag-line__price">{money(item.lineTotal)}</span>
                      <button
                        type="button"
                        className="link"
                        onClick={() => remove(item.key)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {resolved.length > 0 && (
          <div className="drawer__foot">
            {missing > 0 ? (
              <p style={{ fontSize: "var(--t-xs)", color: "var(--ink-faint)" }}>
                Faltam {money(missing)} para o frete cortesia.
              </p>
            ) : (
              <p style={{ fontSize: "var(--t-xs)", color: "var(--state-success)" }}>
                Frete cortesia liberado.
              </p>
            )}
            <div className="totals">
              <div className="totals__row totals__row--grand">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
            </div>
            <Link href="/checkout" className="btn btn--block" onClick={close}>
              <span>Finalizar compra</span>
            </Link>
            <Link href="/sacola" className="link link--static" onClick={close} style={{ textAlign: "center" }}>
              Ver a sacola completa
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

/* ---------------------------------------------------------------- rodapé -- */

export function Footer() {
  const [signed, setSigned] = useState(false);

  return (
    <footer className="footer">
      <div className="shell footer__grid">
        <div>
          <p className="footer__brand">Nascente</p>
          <p className="footer__tagline">
            Perfumaria autoral para o corpo, a casa e os momentos entre os dois.
          </p>
          {signed ? (
            <p style={{ marginTop: "var(--s-4)", fontSize: "var(--t-sm)" }} role="status">
              Inscrição registrada. Até breve.
            </p>
          ) : (
            <form
              className="footer__newsletter"
              onSubmit={(event) => {
                event.preventDefault();
                setSigned(true);
              }}
            >
              <label htmlFor="news-email" className="visually-hidden">
                Seu e-mail para novidades
              </label>
              <input id="news-email" type="email" required placeholder="seu@email.com" />
              <button type="submit" className="btn btn--sm btn--on-dark">
                <span>Assinar</span>
              </button>
            </form>
          )}
        </div>

        <nav aria-label="Loja">
          <h2>Loja</h2>
          <ul>
            <li><Link href="/produtos">Todos os produtos</Link></li>
            <li><Link href="/colecoes">Coleções</Link></li>
            <li><Link href="/guia-olfativo">Guia olfativo</Link></li>
          </ul>
        </nav>

        <nav aria-label="Atendimento">
          <h2>Atendimento</h2>
          <ul>
            <li><Link href="/contato">Fale com a casa</Link></li>
            <li><Link href="/ajuda">Perguntas frequentes</Link></li>
            <li><Link href="/entregas-e-trocas">Entregas e trocas</Link></li>
          </ul>
        </nav>

        <nav aria-label="Institucional">
          <h2>A casa</h2>
          <ul>
            <li><Link href="/sobre">Nossa história</Link></li>
            <li><Link href="/privacidade">Privacidade e termos</Link></li>
          </ul>
        </nav>
      </div>

      <div className="shell footer__base">
        <p className="footer__note">
          Projeto autoral de portfólio da{" "}
          <a href="https://varandaestudioweb.com" target="_blank" rel="noreferrer">
            Varanda Estúdio Web
          </a>
          . Marca, produtos e operação fictícios. Nenhuma compra é processada.
        </p>
        <p className="footer__note">© {new Date().getFullYear()} Nascente</p>
      </div>
    </footer>
  );
}
