"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  collectionBySlug,
  collections,
  money,
  productBySlug,
  products,
  type Collection,
  type Product,
} from "@/lib/catalog";

type CartItem = {
  productId: string;
  size: string;
  quantity: number;
  gift: boolean;
};

type Shipping = {
  value: number;
  label: string;
  estimate: string;
};

const CART_KEY = "nascente-cart-v1";

const Arrow = () => <span aria-hidden="true">↗</span>;

function Mark() {
  return (
    <span className="brand">
      <span className="brand__word">NASCENTE</span>
    </span>
  );
}

function calculateShipping(cep: string, subtotal: number): Shipping | null {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  if (subtotal >= 250) {
    return { value: 0, label: "Frete cortesia", estimate: "3 a 8 dias úteis" };
  }
  const first = Number(clean[0]);
  if (first <= 1)
    return { value: 14.9, label: "Entrega São Paulo", estimate: "2 a 4 dias úteis" };
  if (first === 2)
    return { value: 19.9, label: "Entrega regional", estimate: "3 a 6 dias úteis" };
  if (first <= 4)
    return { value: 24.9, label: "Entrega Sudeste e Sul", estimate: "4 a 8 dias úteis" };
  if (first <= 7)
    return { value: 29.9, label: "Entrega Centro-Oeste e Nordeste", estimate: "6 a 10 dias úteis" };
  return { value: 34.9, label: "Entrega Norte", estimate: "7 a 12 dias úteis" };
}

function productPrice(product: Product, size: string) {
  return (
    product.sizes.find((item) => item.label === size)?.price ?? product.price
  );
}

function Header({
  count,
  onCart,
  transparent = false,
}: {
  count: number;
  onCart: () => void;
  transparent?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [scrollProgress, setScrollProgress] = useState(transparent ? 0 : 1);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    if (!menuOpen) return () => document.body.classList.remove("menu-open");

    const previous = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => {
      menuPanelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    }, 180);

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [
        menuButtonRef.current,
        ...Array.from(
          menuPanelRef.current?.querySelectorAll<HTMLElement>("a, button") ?? [],
        ),
      ].filter((element): element is HTMLElement => Boolean(element));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", handleKeydown);
      previous?.focus();
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 220);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [searchOpen]);

  useEffect(() => {
    let animationFrame = 0;
    if (!transparent) {
      animationFrame = window.requestAnimationFrame(() => setScrollProgress(1));
      return () => window.cancelAnimationFrame(animationFrame);
    }

    const updateHeader = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / 420)));
      });
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateHeader);
    };
  }, [transparent]);

  const links = [
    ["Loja", "/produtos"],
    ["Coleções", "/colecoes"],
    ["Guia olfativo", "/guia-olfativo"],
    ["A Nascente", "/sobre"],
  ];

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchValue.trim();
    window.location.href = value
      ? `/produtos?busca=${encodeURIComponent(value)}`
      : "/produtos";
  };

  const headerProgress =
    !transparent || menuOpen || searchOpen ? 1 : scrollProgress;
  const headerStyle = {
    "--header-progress": headerProgress,
  } as CSSProperties;

  return (
    <>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header
        className={`header ${
          transparent ? "header--adaptive" : "header--surface"
        } ${headerProgress > 0.08 ? "is-scrolled" : ""} ${
          headerProgress > 0.46 ? "has-dark-content" : ""
        }`}
        style={headerStyle}
      >
        <div className="header__menu">
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => {
              setSearchOpen(false);
              setMenuOpen((value) => !value);
            }}
          >
            <span className="sr-only">
              {menuOpen ? "Fechar menu" : "Abrir menu"}
            </span>
            <span className="menu-toggle__lines" aria-hidden="true">
              <i />
              <i />
            </span>
            <span className="menu-toggle__label">
              {menuOpen ? "Fechar" : "Menu"}
            </span>
          </button>
        </div>
        <Link
          className="header__brand"
          href="/"
          aria-label="Nascente, página inicial"
        >
          <Mark />
        </Link>
        <div className="header__actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Buscar produtos"
            aria-expanded={searchOpen}
            aria-controls="header-search-panel"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen((value) => !value);
            }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="10.8" cy="10.8" r="6.7" />
              <path d="m16 16 4.1 4.1" />
            </svg>
          </button>
          <button
            type="button"
            className="bag icon-button"
            onClick={onCart}
            aria-label={`Abrir sacola com ${count} ${count === 1 ? "item" : "itens"}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5.5 8.5h13l-.8 12h-11.4l-.8-12Z" />
              <path d="M9 9V6.7a3 3 0 0 1 6 0V9" />
            </svg>
            <span>{count}</span>
          </button>
        </div>
      </header>
      <div
        id="header-search-panel"
        className={`header-search ${searchOpen ? "is-open" : ""}`}
        aria-hidden={!searchOpen}
      >
        <form onSubmit={submitSearch} role="search">
          <label htmlFor="header-search">O que você procura?</label>
          <div>
            <input
              ref={searchInputRef}
              id="header-search"
              type="search"
              value={searchValue}
              placeholder="Colônia, vela, bergamota..."
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <button type="submit">Buscar</button>
            <button
              type="button"
              className="header-search__close"
              onClick={() => setSearchOpen(false)}
              aria-label="Fechar pesquisa"
            >
              Fechar
            </button>
          </div>
        </form>
      </div>
      <button
        type="button"
        className={`menu-backdrop ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        ref={menuPanelRef}
        id="mobile-nav"
        className={`mobile-nav ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
      >
        <nav aria-label="Navegação móvel">
          {[
            ...links,
            ["Ajuda", "/ajuda"],
            ["Contato", "/contato"],
          ].map(
            ([label, href], index) => (
              <Link
                href={href}
                key={href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {label}
                <Arrow />
              </Link>
            ),
          )}
        </nav>
        <p>Fragrâncias para o corpo, a casa e os momentos entre os dois.</p>
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer__lead">
        <Link
          className="footer__brand"
          href="/"
          aria-label="Nascente, página inicial"
        >
          <Mark />
        </Link>
        <p>Fragrâncias para o corpo, a casa e os momentos entre os dois.</p>
      </div>
      <nav className="footer__nav" aria-label="Navegação do rodapé">
        <Link href="/produtos">Loja</Link>
        <Link href="/colecoes">Coleções</Link>
        <Link href="/guia-olfativo">Guia olfativo</Link>
        <Link href="/sobre">Nossa história</Link>
        <Link href="/ajuda">Ajuda</Link>
        <Link href="/contato">Contato</Link>
        <Link href="/politicas">Privacidade e termos</Link>
      </nav>
      <div className="footer__bottom">
        <span>© 2026 Nascente Casa Olfativa</span>
        <span>São Paulo · Brasil</span>
        <span>Projeto conceitual criado para portfólio.</span>
      </div>
    </footer>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  const collection = collections.find(
    (item) => item.slug === product.collection,
  );
  return (
    <article className="shop-card">
      <Link
        href={`/produtos/${product.slug}`}
        className={`shop-card__image tone--${product.collection}`}
      >
        <Image
          unoptimized
          src={product.image}
          alt={`${product.name} da coleção ${collection?.name ?? "Nascente"}`}
          fill
          sizes="(max-width: 720px) 82vw, 30vw"
        />
        {product.featured && <span className="shop-card__badge">Favorito</span>}
      </Link>
      <div className="shop-card__meta">
        <p className="eyebrow">
          {product.category} · {collection?.name}
        </p>
        <h3>
          <Link href={`/produtos/${product.slug}`}>{product.name}</Link>
        </h3>
        <p>{product.description}</p>
        <div className="shop-card__buy">
          <strong>A partir de {money(product.price)}</strong>
          <button
            type="button"
            onClick={() => onAdd(product)}
            aria-label={`Adicionar ${product.name} à sacola`}
          >
            Adicionar <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  open,
  items,
  subtotal,
  onClose,
  onQuantity,
  onRemove,
}: {
  open: boolean;
  items: CartItem[];
  subtotal: number;
  onClose: () => void;
  onQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("drawer-open");
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("drawer-open");
      document.removeEventListener("keydown", closeOnEscape);
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <div className={`drawer-layer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="drawer-backdrop"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        aria-label="Fechar sacola"
      />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Sua seleção</p>
            <h2 id="drawer-title">Sacola</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            Fechar ×
          </button>
        </div>
        {items.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">○</span>
            <h3>Sua sacola está leve.</h3>
            <p>
              Comece pelas coleções ou use o Guia Olfativo para encontrar uma
              atmosfera.
            </p>
            <Link href="/produtos" className="button button--dark" onClick={onClose}>
              Descobrir produtos <Arrow />
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item, index) => {
                const product = products.find(
                  (entry) => entry.id === item.productId,
                );
                if (!product) return null;
                return (
                  <article className="cart-line" key={`${item.productId}-${item.size}`}>
                    <div className="cart-line__image">
                      <Image unoptimized src={product.image} alt="" fill sizes="104px" />
                    </div>
                    <div>
                      <p className="eyebrow">{item.size}</p>
                      <h3>{product.name}</h3>
                      <p>{money(productPrice(product, item.size))}</p>
                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() =>
                            onQuantity(index, Math.max(1, item.quantity - 1))
                          }
                          aria-label={`Diminuir quantidade de ${product.name}`}
                        >
                          −
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onQuantity(index, item.quantity + 1)}
                          aria-label={`Aumentar quantidade de ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="remove"
                      onClick={() => onRemove(index)}
                    >
                      Remover
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="cart-total">
              <p>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </p>
              <small>Frete calculado na sacola.</small>
              <Link href="/sacola" className="button" onClick={onClose}>
                Revisar sacola <Arrow />
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function Home({ onAdd }: { onAdd: (product: Product) => void }) {
  const featured = products.filter((product) => product.featured).slice(0, 4);
  return (
    <main id="conteudo">
      <section className="hero hero--terra">
        <div className="hero__image">
          <Image
            unoptimized
            src="/images/hq/hero-central-nascente.webp"
            alt="Frasco de perfume Nascente em âmbar ao centro, entre folhas, bergamota e pedra molhada"
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="hero__copy">
          <p className="eyebrow">Coleção Chuva Clara</p>
          <h1>O perfume da chuva sobre a terra.</h1>
          <div className="actions">
            <Link className="button button--wine" href="/produtos/colonia-chuva-clara">
              Descobrir a fragrância
            </Link>
            <Link className="text-link" href="/colecoes/chuva-clara">
              Explorar a coleção
            </Link>
          </div>
        </div>
      </section>
      <section className="section products-section home-catalog">
        <div className="section-head">
          <div>
            <p className="eyebrow">A casa olfativa</p>
            <h2>Fragrâncias para a pele, a casa e a memória.</h2>
          </div>
          <Link className="text-link" href="/produtos">
            Ver todos os produtos
          </Link>
        </div>
        <div className="products">
          {featured.map((product) => (
            <ProductCard product={product} onAdd={onAdd} key={product.id} />
          ))}
        </div>
      </section>
      <section className="section section--collections" id="colecoes">
        <div className="section-head">
          <div>
            <p className="eyebrow">Coleções da casa</p>
            <h2>Três atmosferas. Um jeito próprio de sentir.</h2>
          </div>
          <Link className="text-link" href="/colecoes">
            Ver todas as coleções
          </Link>
        </div>
        <div className="collections">
          {collections.map((collection) => (
            <article key={collection.slug}>
              <Link
                className="collection-image"
                href={`/colecoes/${collection.slug}`}
              >
                <Image
                  unoptimized
                  src={collection.image}
                  alt={`Produtos da coleção ${collection.name}`}
                  fill
                  sizes="(max-width: 720px) 82vw, 33vw"
                />
              </Link>
              <p className="eyebrow">{collection.family}</p>
              <h3>
                <Link href={`/colecoes/${collection.slug}`}>{collection.name}</Link>
              </h3>
              <p>{collection.description}</p>
              <ul>
                {collection.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
      <section className="shop-by-ritual">
        <div className="shop-by-ritual__image">
          <Image
            unoptimized
            src="/images/hq/editorial-ritual.webp"
            alt="Ritual Nascente com óleo corporal, hidratante, vela, cerâmica e linho"
            fill
            sizes="(max-width: 900px) 100vw, 54vw"
          />
        </div>
        <div>
          <p className="eyebrow">Seu ritual, sua escolha</p>
          <h2>Do banho à casa pronta para receber.</h2>
          <p>
            Camadas de aroma criadas para acompanhar o corpo, habitar os
            espaços e atravessar o dia sem pressa.
          </p>
          <div className="ritual-values" aria-label="Diferenciais Nascente">
            <div>
              <span aria-hidden="true">✦</span>
              <p>
                <strong>Criação autoral</strong>
                Três famílias, muitos rituais
              </p>
            </div>
            <div>
              <span aria-hidden="true">○</span>
              <p>
                <strong>Feito em pequenos lotes</strong>
                Frescor e cuidado em cada etapa
              </p>
            </div>
            <div>
              <span aria-hidden="true">↺</span>
              <p>
                <strong>Embalagens cuidadosas</strong>
                Materiais escolhidos para durar
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="guide guide--terra" id="guia">
        <div className="guide__image">
          <Image
            unoptimized
            src="/images/hq/editorial-materias.webp"
            alt="Bergamota, chá preto, resinas, folhas e madeiras usados como referências olfativas"
            fill
            sizes="(max-width: 900px) 100vw, 52vw"
          />
        </div>
        <div>
          <p className="eyebrow">Guia Olfativo</p>
          <h2>Não é preciso sentir antes para começar bem.</h2>
          <p>
            Conte como você quer se sentir e em qual momento pretende usar.
            Nosso guia aproxima você da família que faz mais sentido.
          </p>
          <Link className="button button--cream" href="/guia-olfativo">
            Encontrar meu aroma <Arrow />
          </Link>
        </div>
      </section>
    </main>
  );
}

function PageHero({
  eyebrow,
  title,
  text,
  color = "cream",
  image,
  imageAlt = "",
  layout = "centered",
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
  color?: "cream" | "blue" | "lilac" | "orange";
  image?: string;
  imageAlt?: string;
  layout?: "centered" | "horizontal";
}) {
  return (
    <section
      className={`page-hero page-hero--${color} ${
        image ? "page-hero--media" : ""
      } page-hero--${layout}`}
    >
      {image && (
        <Image
          unoptimized
          className="page-hero__image"
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
        />
      )}
      <div className="page-hero__content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function Catalog({
  onAdd,
  initialCategory,
}: {
  onAdd: (product: Product) => void;
  initialCategory?: Product["category"];
}) {
  const [query, setQuery] = useState("");
  const [productCategory, setProductCategory] = useState<
    Product["category"] | "Todos"
  >(initialCategory ?? "Todos");
  const [collection, setCollection] = useState("Todas");
  const [family, setFamily] = useState("Todas");
  const [sort, setSort] = useState("destaque");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchValue = params.get("busca");
    const categoryValue = params.get("categoria");
    const validCategories = new Set(
      products.map((product) => product.category),
    );
    const frame = window.requestAnimationFrame(() => {
      if (searchValue && searchValue !== "aberta") setQuery(searchValue);
      if (categoryValue && validCategories.has(categoryValue as Product["category"])) {
        setProductCategory(categoryValue as Product["category"]);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLocaleLowerCase("pt-BR").trim();
    let result = products.filter((product) => {
      const searchable = [
        product.name,
        product.category,
        product.family,
        ...product.notes,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return (
        (productCategory === "Todos" ||
          product.category === productCategory) &&
        (!normalized || searchable.includes(normalized)) &&
        (collection === "Todas" || product.collection === collection) &&
        (family === "Todas" || product.family === family)
      );
    });
    if (sort === "menor") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "maior") result = [...result].sort((a, b) => b.price - a.price);
    if (sort === "nome")
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return result;
  }, [collection, family, productCategory, query, sort]);

  return (
    <main id="conteudo">
      <PageHero
        eyebrow="Corpo · casa · perfumaria"
        title="Todo o catálogo."
        text="Encontre por categoria, coleção ou notas. Cada produto conversa com os demais da mesma atmosfera."
        color="cream"
        image="/images/hq/hero-terra-editorial.webp"
        imageAlt="Perfume Nascente entre folhagens e bergamota"
        layout="horizontal"
      />
      <section className="catalog-shell">
        <div className="catalog-tools">
          <label className="search-field">
            <span>Buscar no catálogo</span>
            <input
              type="search"
              value={query}
              placeholder="Produto, coleção ou nota"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            <span>Categoria</span>
            <select
              value={productCategory}
              onChange={(event) =>
                setProductCategory(
                  event.target.value as Product["category"] | "Todos",
                )
              }
            >
              <option>Todos</option>
              {[...new Set(products.map((item) => item.category))].map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </label>
          <label>
            <span>Coleção</span>
            <select
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
            >
              <option>Todas</option>
              {collections.map((item) => (
                <option value={item.slug} key={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Família</span>
            <select value={family} onChange={(event) => setFamily(event.target.value)}>
              <option>Todas</option>
              {[...new Set(products.map((item) => item.family))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Ordenar</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="destaque">Destaques</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
              <option value="nome">Nome</option>
            </select>
          </label>
        </div>
        <div className="catalog-count">
          <p>{filtered.length} produtos encontrados</p>
          {(query ||
            productCategory !== "Todos" ||
            collection !== "Todas" ||
            family !== "Todas") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setProductCategory("Todos");
                setCollection("Todas");
                setFamily("Todas");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
        {filtered.length ? (
          <div className="catalog-grid">
            {filtered.map((product) => (
              <ProductCard product={product} onAdd={onAdd} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <span aria-hidden="true">○</span>
            <h2>Nenhuma combinação por aqui.</h2>
            <p>Experimente buscar por “cedro”, “casa” ou limpar os filtros.</p>
            <button
              type="button"
              className="button button--dark"
              onClick={() => {
                setQuery("");
                setProductCategory("Todos");
                setCollection("Todas");
                setFamily("Todas");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function CollectionsPage() {
  return (
    <main id="conteudo">
      <PageHero
        eyebrow="Três atmosferas"
        title={
          <>
            <span className="page-hero__title-line">Uma casa</span>
            <span className="page-hero__title-line">Três maneiras</span>
            <span className="page-hero__title-line">de sentir.</span>
          </>
        }
        text="Cada coleção nasce de uma atmosfera e se expande por produtos para a pele, o ambiente e o gesto de presentear."
        color="blue"
        image="/images/hq/editorial-materias.webp"
        imageAlt="Matérias-primas e frascos Nascente em composição editorial"
        layout="horizontal"
      />
      <section className="collection-list" aria-labelledby="collection-list-title">
        <div className="collection-list__heading">
          <p className="eyebrow">Escolha por sensação</p>
          <h2 id="collection-list-title">Três caminhos olfativos.</h2>
          <p>
            Compare família, notas e atmosfera antes de entrar em cada
            coleção.
          </p>
        </div>
        <div className="collection-list__grid">
        {collections.map((collection) => (
          <article
            className={`collection-card collection-card--${collection.slug}`}
            key={collection.slug}
          >
            <Link
              className="collection-card__image"
              href={`/colecoes/${collection.slug}`}
              aria-label={`Conhecer a coleção ${collection.name}`}
            >
              <Image
                unoptimized
                src={collection.image}
                alt={`Produtos ${collection.name}`}
                fill
                sizes="(max-width: 760px) 100vw, 33vw"
              />
            </Link>
            <div className="collection-card__content">
              <p className="eyebrow">
                {collection.family}
              </p>
              <h3>{collection.name}</h3>
              <p>{collection.description}</p>
              <ul aria-label={`Notas da coleção ${collection.name}`}>
                {collection.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <Link className="text-link" href={`/colecoes/${collection.slug}`}>
                Explorar a coleção <Arrow />
              </Link>
            </div>
          </article>
        ))}
        </div>
      </section>
    </main>
  );
}

function CollectionPage({
  collection,
  onAdd,
}: {
  collection: Collection;
  onAdd: (product: Product) => void;
}) {
  const related = products.filter(
    (product) => product.collection === collection.slug,
  );
  return (
    <main id="conteudo">
      <section className={`collection-hero collection-hero--${collection.slug}`}>
        <div>
          <p className="eyebrow">{collection.family}</p>
          <h1>{collection.name}</h1>
          <p>{collection.description}</p>
          <ul>
            {collection.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <div className="collection-hero__image">
          <Image
            unoptimized
            src={collection.heroImage}
            alt={`Composição de produtos ${collection.name}`}
            fill
            priority
            sizes="(max-width: 850px) 100vw, 56vw"
          />
        </div>
      </section>
      <section className="scent-profile">
        <div>
          <p className="eyebrow">Família</p>
          <strong>{collection.family}</strong>
        </div>
        <div>
          <p className="eyebrow">Intensidade</p>
          <strong>
            {collection.slug === "chuva-clara"
              ? "Leve a moderada"
              : collection.slug === "folha-quente"
                ? "Moderada"
                : "Moderada a marcante"}
          </strong>
        </div>
        <div>
          <p className="eyebrow">Para quando</p>
          <strong>
            {collection.slug === "chuva-clara"
              ? "Manhãs e dias quentes"
              : collection.slug === "folha-quente"
                ? "Fim de tarde e casa"
                : "Encontros e presentes"}
          </strong>
        </div>
      </section>
      <section className="section products-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">A coleção completa</p>
            <h2>Da pele para a casa.</h2>
          </div>
        </div>
        <div className="catalog-grid">
          {related.map((product) => (
            <ProductCard product={product} onAdd={onAdd} key={product.id} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ShippingCalculator({ subtotal = 0 }: { subtotal?: number }) {
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [error, setError] = useState("");

  const calculate = () => {
    const result = calculateShipping(cep, subtotal);
    if (!result) {
      setError("Digite um CEP válido no formato 00000-000.");
      setShipping(null);
      return;
    }
    setError("");
    setShipping(result);
  };

  return (
    <div className="shipping-box">
      <div className="shipping-box__heading">
        <span aria-hidden="true">⌖</span>
        <div>
          <strong>Entrega e prazo</strong>
          <small>Consulte as opções disponíveis para o seu CEP.</small>
        </div>
      </div>
      <div className="shipping-box__form">
        <label htmlFor="cep-product">CEP</label>
        <div>
          <input
            id="cep-product"
            inputMode="numeric"
            value={cep}
            placeholder="00000-000"
            maxLength={9}
            aria-describedby={error ? "cep-product-error" : undefined}
            onChange={(event) => setCep(event.target.value)}
          />
          <button type="button" onClick={calculate}>
            Consultar
          </button>
        </div>
      </div>
      {error && (
        <p className="field-error" id="cep-product-error">
          {error}
        </p>
      )}
      {shipping && (
        <p className="shipping-result" role="status">
          <span>{shipping.label}</span>
          <strong>{shipping.value ? money(shipping.value) : "Grátis"}</strong>
          <small>{shipping.estimate}</small>
        </p>
      )}
    </div>
  );
}

function ProductPage({
  product,
  onAddConfigured,
}: {
  product: Product;
  onAddConfigured: (
    product: Product,
    size: string,
    quantity: number,
  ) => void;
}) {
  const defaultSize =
    product.sizes.find((size) => size.available) ?? product.sizes[0];
  const [size, setSize] = useState(defaultSize.label);
  const [quantity, setQuantity] = useState(1);
  const currentPrice = productPrice(product, size);
  const collection = collections.find(
    (entry) => entry.slug === product.collection,
  );
  const related = products
    .filter(
      (entry) =>
        entry.id !== product.id && entry.collection === product.collection,
    )
    .slice(0, 3);

  return (
    <main id="conteudo">
      <section className="product-detail">
        <div className={`product-detail__gallery tone--${product.collection}`}>
          <Image
            unoptimized
            src={product.image}
            alt={`Embalagem de ${product.name}`}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 54vw"
          />
          <span>{product.category}</span>
        </div>
        <div className="product-detail__info">
          <p className="eyebrow">
            {collection?.name} · {product.family}
          </p>
          <h1>{product.name}</h1>
          <p className="product-price">{money(currentPrice)}</p>
          <p className="product-description">{product.description}</p>
          <fieldset className="option-group">
            <legend>Escolha o tamanho</legend>
            <div>
              {product.sizes.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  disabled={!option.available}
                  aria-pressed={size === option.label}
                  onClick={() => option.available && setSize(option.label)}
                >
                  {option.label}
                  <small>
                    {option.available ? money(option.price) : "Indisponível"}
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="product-actions">
            <div className="quantity quantity--large">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Diminuir quantidade"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="button product-add-button"
              onClick={() => onAddConfigured(product, size, quantity)}
            >
              Adicionar à sacola · {money(currentPrice * quantity)}
            </button>
          </div>
          <ShippingCalculator subtotal={currentPrice * quantity} />
          <section className="olfactory-profile" aria-labelledby="olfactory-title">
            <div className="olfactory-profile__heading">
              <p className="eyebrow">A fragrância</p>
              <h2 id="olfactory-title">Perfil olfativo</h2>
              <p>
                Uma leitura clara das notas, da presença e dos momentos em que
                esta composição se revela melhor.
              </p>
            </div>
            <ul className="olfactory-notes" aria-label="Notas olfativas">
              {product.notes.map((note, index) => (
                <li key={note}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{note}</strong>
                </li>
              ))}
            </ul>
            <div className="olfactory-details">
              <div>
                <span>Família</span>
                <strong>{product.family}</strong>
              </div>
              <div>
                <span>Intensidade</span>
                <strong>{product.intensity} de 5</strong>
                <div
                  className="intensity-meter"
                  aria-label={`Intensidade ${product.intensity} de 5`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <i
                      className={index < product.intensity ? "is-active" : ""}
                      key={index}
                    />
                  ))}
                </div>
              </div>
              <div>
                <span>Para quando</span>
                <strong>{product.occasion.join(" · ")}</strong>
              </div>
            </div>
          </section>
        </div>
      </section>
      <section className="section products-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Na mesma atmosfera</p>
            <h2>Continue a coleção.</h2>
          </div>
        </div>
        <div className="catalog-grid catalog-grid--compact">
          {related.map((entry) => (
            <ProductCard
              key={entry.id}
              product={entry}
              onAdd={(item) =>
                onAddConfigured(
                  item,
                  item.sizes.find((option) => option.available)?.label ??
                    item.sizes[0].label,
                  1,
                )
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function GuidePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    feeling: "",
    family: "",
    occasion: "",
  });

  const questions = [
    {
      key: "feeling",
      title: "O que você quer sentir?",
      options: ["Frescor e clareza", "Aconchego e profundidade", "Luz e presença"],
    },
    {
      key: "family",
      title: "Qual caminho parece mais seu?",
      options: ["Cítrico e mineral", "Verde e amadeirado", "Cítrico e ambarado"],
    },
    {
      key: "occasion",
      title: "Para qual momento?",
      options: ["Rotina e trabalho", "Casa e desaceleração", "Encontros e presentes"],
    },
  ] as const;

  const result =
    answers.feeling.includes("Frescor") || answers.family.includes("mineral")
      ? collections[0]
      : answers.feeling.includes("Aconchego") ||
          answers.family.includes("amadeirado")
        ? collections[1]
        : collections[2];

  if (step === 3) {
    return (
      <main id="conteudo">
        <section className={`guide-result guide-result--${result.slug}`}>
          <div>
            <p className="eyebrow">Sua atmosfera mais próxima</p>
            <h1>{result.name}</h1>
            <p>{result.description}</p>
            <ul>
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <div className="actions">
              <Link className="button button--dark" href={`/colecoes/${result.slug}`}>
                Conhecer a coleção <Arrow />
              </Link>
              <button
                type="button"
                className="text-link reset-button"
                onClick={() => {
                  setStep(0);
                  setAnswers({ feeling: "", family: "", occasion: "" });
                }}
              >
                Refazer guia
              </button>
            </div>
          </div>
          <div className="guide-result__image">
            <Image
              unoptimized
              src={result.image}
              alt={`Produtos ${result.name}`}
              fill
              sizes="(max-width: 850px) 100vw, 52vw"
            />
          </div>
        </section>
      </main>
    );
  }

  const question = questions[step];
  const current = answers[question.key];
  return (
    <main id="conteudo">
      <PageHero
        eyebrow="Guia Olfativo"
        title="Encontre a atmosfera que fala com você."
        text="Três perguntas simples aproximam sensações, famílias olfativas e momentos de uso."
        color="blue"
        image="/images/hq/editorial-materias.webp"
        imageAlt="Matérias-primas e perfume Nascente em uma composição sensorial"
        layout="horizontal"
      />
      <section className="guide-quiz guide-quiz--full">
        <aside className="guide-quiz__intro">
          <p className="eyebrow">Seu caminho olfativo</p>
          <h2>Escolha pela sensação.</h2>
          <p>
            Responda pelo que mais se aproxima do seu momento. Ao final,
            apresentamos uma das três coleções Nascente e explicamos por que ela
            pode combinar com você.
          </p>
          <ol>
            <li className={step === 0 ? "is-active" : ""}>
              <span>01</span> Sensação
            </li>
            <li className={step === 1 ? "is-active" : ""}>
              <span>02</span> Família
            </li>
            <li className={step === 2 ? "is-active" : ""}>
              <span>03</span> Momento
            </li>
          </ol>
        </aside>
        <div className="guide-quiz__stage">
          <div className="quiz-progress">
            <p className="eyebrow">Etapa atual</p>
            <span>
              {String(step + 1).padStart(2, "0")} / 03
            </span>
            <div>
              <i style={{ width: `${((step + 1) / 3) * 100}%` }} />
            </div>
          </div>
          <div className="quiz-question">
            <h2>{question.title}</h2>
            <p>Escolha a resposta mais próxima. Não existe resposta certa.</p>
            <div className="quiz-options">
              {question.options.map((option, index) => (
                <button
                  type="button"
                  key={option}
                  aria-pressed={current === option}
                  onClick={() =>
                    setAnswers((value) => ({
                      ...value,
                      [question.key]: option,
                    }))
                  }
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{option}</strong>
                  <Arrow />
                </button>
              ))}
            </div>
            <div className="quiz-actions">
              {step > 0 && (
                <button type="button" onClick={() => setStep((value) => value - 1)}>
                  ← Voltar
                </button>
              )}
              <button
                type="button"
                className="button button--dark"
                disabled={!current}
                onClick={() => current && setStep((value) => value + 1)}
              >
                Continuar <Arrow />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContentPage({
  eyebrow,
  title,
  intro,
  children,
  color = "cream",
  image,
  imageAlt,
  heroLayout = "centered",
  contentClassName = "",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  color?: "cream" | "blue" | "lilac" | "orange";
  image?: string;
  imageAlt?: string;
  heroLayout?: "centered" | "horizontal";
  contentClassName?: string;
}) {
  return (
    <main id="conteudo">
      <PageHero
        eyebrow={eyebrow}
        title={title}
        text={intro}
        color={color}
        image={image}
        imageAlt={imageAlt}
        layout={heroLayout}
      />
      <section className={`content-page ${contentClassName}`.trim()}>
        {children}
      </section>
    </main>
  );
}

function AboutPage() {
  return (
    <main id="conteudo">
      <section className="about-hero">
        <div>
          <p className="eyebrow">São Paulo · desde 2021</p>
          <h1>Entre a casa e a pele, existe atmosfera.</h1>
          <p>
            A Nascente cria fragrâncias como quem compõe um espaço: por
            contraste, camada, memória e presença.
          </p>
        </div>
        <div>
          <Image
            unoptimized
            src="/images/hq/editorial-materias.webp"
            alt="Vela e difusor da coleção Folha Quente"
            fill
            priority
            sizes="(max-width: 850px) 100vw, 52vw"
          />
        </div>
      </section>
      <section className="story-timeline" aria-labelledby="story-timeline-title">
        <div className="story-timeline__heading">
          <p className="eyebrow">Nossa trajetória</p>
          <h2 id="story-timeline-title" className="story-title--single">
            Da casa para a pele.
          </h2>
          <p>
            Uma evolução guiada pela mesma ideia: tornar a escolha de uma
            fragrância mais sensorial, clara e próxima.
          </p>
        </div>
        <div className="story-timeline__track">
          <article>
            <div className="story-timeline__marker" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M5 14.5 16 5l11 9.5V27H5Z" />
                <path d="M12 27v-8h8v8M10 13h12" />
              </svg>
            </div>
            <span>2021</span>
            <h3>Primeiro, a casa.</h3>
            <p>
              A Nascente começa em São Paulo com velas, difusores e sprays de
              ambiente organizados por atmosferas completas.
            </p>
          </article>
          <article>
            <div className="story-timeline__marker" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M12 4h8v5l3 4v14H9V13l3-4Z" />
                <path d="M12 9h8M12 18h8M12 22h8" />
              </svg>
            </div>
            <span>2024</span>
            <h3>Depois, a pele.</h3>
            <p>
              As coleções ganham colônias, sabonetes, hidratantes e óleos. O
              perfume passa a acompanhar os rituais do dia.
            </p>
          </article>
          <article>
            <div className="story-timeline__marker" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <circle cx="11" cy="16" r="6" />
                <circle cx="21" cy="16" r="6" />
                <path d="M16 6v20" />
              </svg>
            </div>
            <span>Hoje</span>
            <h3 className="story-title--single">Um vocabulário só.</h3>
            <p>
              Corpo, casa e presentes compartilham as mesmas três coleções,
              facilitando combinações sem excesso de opções.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

const faqItems = [
  [
    "Como escolher uma fragrância sem experimentar?",
    "Use o Guia Olfativo e compare família, intensidade e ocasião. O Kit Descoberta reúne as três colônias em 10 ml para um primeiro contato gradual.",
  ],
  [
    "Produtos da mesma coleção têm o mesmo aroma?",
    "Eles compartilham a mesma atmosfera e notas principais, mas a percepção varia conforme a base, a categoria e a forma de uso.",
  ],
  [
    "Quanto tempo uma vela deve ficar acesa?",
    "Na primeira queima, aguarde a cera derreter por toda a superfície. Nas seguintes, evite períodos superiores a quatro horas e nunca deixe a vela sem supervisão.",
  ],
  [
    "É possível enviar como presente?",
    "Sim. A embalagem para presente pode ser adicionada à sacola por R$ 12,00. Os kits já possuem apresentação própria.",
  ],
  [
    "Como funciona a troca?",
    "Nesta mesma página, a seção Entrega, troca e presentes reúne os prazos e as condições previstas para cada situação.",
  ],
];

function HelpPage() {
  return (
    <ContentPage
      eyebrow="Central de Ajuda"
      title="Ajuda, entregas e trocas."
      intro="Respostas claras para escolher, receber, presentear e, quando necessário, solicitar uma troca."
      color="lilac"
      image="/images/hq/editorial-ritual.webp"
      imageAlt="Vela e fragrância Nascente em uma composição acolhedora"
      heroLayout="horizontal"
      contentClassName="help-content"
    >
      <div className="content-section-heading">
        <p className="eyebrow">Perguntas frequentes</p>
        <h2>Antes de escolher.</h2>
        <p>
          Informações sobre fragrâncias, formatos, presentes e conservação dos
          produtos.
        </p>
      </div>
      <div className="faq-list">
        {faqItems.map(([question, answer], index) => (
          <details key={question} open={index === 0}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      <div className="content-section-heading content-section-heading--spaced">
        <p className="eyebrow">Depois da escolha</p>
        <h2>Entrega, troca e presentes.</h2>
        <p>
          O prazo e o valor finais são apresentados depois da consulta do CEP.
          As condições gerais ficam reunidas aqui.
        </p>
      </div>
      <div className="info-grid">
        <article>
          <h2>Entrega</h2>
          <p>
            O prazo começa após a confirmação do pedido. O valor varia por CEP
            e o frete é cortesia em compras a partir de R$ 250,00.
          </p>
        </article>
        <article>
          <h2>Troca</h2>
          <p>
            Produtos sem sinais de uso podem ser avaliados para troca em até
            sete dias corridos após o recebimento, com embalagem preservada.
          </p>
        </article>
        <article>
          <h2>Avaria</h2>
          <p>
            Se o pedido chegar danificado, fotografe a embalagem e o produto e
            fale com atendimento em até 48 horas.
          </p>
        </article>
        <article>
          <h2>Presentes</h2>
          <p>
            Kits têm apresentação própria. Itens avulsos podem receber
            embalagem especial adicionada à sacola.
          </p>
        </article>
      </div>
      <div className="legal-note">
        <strong>Importante</strong>
        <p>
          Prazos finais dependem do CEP e são apresentados antes da conclusão
          da compra.
        </p>
      </div>
      <aside className="help-card">
        <p className="eyebrow">Ainda precisa de ajuda?</p>
        <h2>Converse com atendimento.</h2>
        <p>
          Escreva para{" "}
          <a href="mailto:atendimento@nascentecasa.com.br">
            atendimento@nascentecasa.com.br
          </a>
          .
        </p>
      </aside>
    </ContentPage>
  );
}

function ContactPage() {
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      setStatus("error");
      setError("Revise os campos obrigatórios antes de continuar.");
      return;
    }
    setStatus("success");
    setError("");
  };

  return (
    <main id="conteudo">
      <PageHero
        eyebrow="Atendimento"
        title="Uma conversa de cada vez."
        text="Dúvidas sobre uma coleção, um presente ou um pedido? Conte o contexto para encontrarmos a resposta certa."
        color="blue"
        image="/images/hq/editorial-ritual.webp"
        imageAlt="Produtos Nascente em uma composição de cuidado e perfumaria"
        layout="horizontal"
      />
      <section className="contact-page" aria-labelledby="contact-title">
        <div className="contact-page__heading">
          <p className="eyebrow">Atendimento Nascente</p>
          <h2 id="contact-title">Como podemos ajudar?</h2>
          <p>
            Escolha o assunto e compartilhe os detalhes necessários. Assim, a
            conversa já começa pelo ponto certo.
          </p>
        </div>
        <div className="contact-channels" aria-label="Informações de atendimento">
          <div>
            <span aria-hidden="true">01</span>
            <strong>E-mail</strong>
            <a href="mailto:atendimento@nascentecasa.com.br">
              atendimento@nascentecasa.com.br
            </a>
          </div>
          <div>
            <span aria-hidden="true">02</span>
            <strong>Horário</strong>
            <p>Segunda a sexta, das 9h às 18h.</p>
          </div>
          <div>
            <span aria-hidden="true">03</span>
            <strong>Para agilizar</strong>
            <p>Inclua o número do pedido, quando houver.</p>
          </div>
        </div>
        <form className="contact-form" noValidate onSubmit={submit}>
          {status === "error" && (
            <p className="form-alert form-alert--error" role="alert">
              {error}
            </p>
          )}
          {status === "success" ? (
            <div className="form-success" role="status">
              <span>✓</span>
              <h2>Mensagem preparada.</h2>
              <p>
                Neste ambiente, o formulário não transmite dados. Para falar
                com atendimento, envie sua mensagem para{" "}
                <a href="mailto:atendimento@nascentecasa.com.br">
                  atendimento@nascentecasa.com.br
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="contact-form__row">
                <label>
                  <span>Nome *</span>
                  <input name="name" required autoComplete="name" />
                </label>
                <label>
                  <span>E-mail *</span>
                  <input name="email" type="email" required autoComplete="email" />
                </label>
              </div>
              <div className="contact-form__row">
                <label>
                  <span>Assunto *</span>
                  <select name="subject" required defaultValue="">
                    <option value="" disabled>
                      Selecione
                    </option>
                    <option>Escolha de fragrância</option>
                    <option>Entrega ou troca</option>
                    <option>Presentes</option>
                    <option>Outro assunto</option>
                  </select>
                </label>
                <label>
                  <span>Número do pedido</span>
                  <input
                    name="order"
                    inputMode="numeric"
                    placeholder="Opcional"
                    autoComplete="off"
                  />
                </label>
              </div>
              <label>
                <span>Mensagem *</span>
                <textarea name="message" rows={7} required />
              </label>
              <button className="button button--dark" type="submit">
                Preparar mensagem <Arrow />
              </button>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

function BagPage({
  items,
  subtotal,
  onQuantity,
  onRemove,
  onGift,
}: {
  items: CartItem[];
  subtotal: number;
  onQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
  onGift: (index: number, gift: boolean) => void;
}) {
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [cepError, setCepError] = useState("");
  const total = subtotal + (shipping?.value ?? 0);

  const calculate = () => {
    const result = calculateShipping(cep, subtotal);
    if (!result) {
      setCepError("Digite um CEP válido no formato 00000-000.");
      setShipping(null);
      return;
    }
    setCepError("");
    setShipping(result);
  };

  return (
    <main id="conteudo">
      <section className="bag-hero" aria-labelledby="bag-title">
        <Image
          unoptimized
          src="/images/hq/presente-completo.webp"
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div>
          <p className="eyebrow">Sua seleção</p>
          <h1 id="bag-title">Sacola</h1>
        </div>
      </section>
      {items.length === 0 ? (
        <section className="bag-empty">
          <span aria-hidden="true">○</span>
          <h2>Sua sacola está vazia.</h2>
          <p>Comece pelo catálogo ou encontre uma coleção no Guia Olfativo.</p>
          <Link className="button button--dark" href="/produtos">
            Descobrir produtos <Arrow />
          </Link>
        </section>
      ) : (
        <section className="bag-layout">
          <div className="bag-lines">
            {items.map((item, index) => {
              const product = products.find(
                (entry) => entry.id === item.productId,
              );
              if (!product) return null;
              return (
                <article className="bag-line" key={`${item.productId}-${item.size}`}>
                  <Link
                    href={`/produtos/${product.slug}`}
                    className="bag-line__image"
                  >
                    <Image unoptimized src={product.image} alt="" fill sizes="180px" />
                  </Link>
                  <div>
                    <p className="eyebrow">
                      {product.category} · {item.size}
                    </p>
                    <h2>
                      <Link href={`/produtos/${product.slug}`}>{product.name}</Link>
                    </h2>
                    <p>{money(productPrice(product, item.size))}</p>
                    <div className="quantity quantity--large">
                      <button
                        type="button"
                        onClick={() =>
                          onQuantity(index, Math.max(1, item.quantity - 1))
                        }
                        aria-label={`Diminuir quantidade de ${product.name}`}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onQuantity(index, item.quantity + 1)}
                        aria-label={`Aumentar quantidade de ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                    <label className="gift-check">
                      <input
                        type="checkbox"
                        checked={item.gift}
                        onChange={(event) => onGift(index, event.target.checked)}
                      />
                      <span>Adicionar embalagem para presente (+ R$ 12,00)</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="remove"
                    onClick={() => onRemove(index)}
                  >
                    Remover
                  </button>
                </article>
              );
            })}
          </div>
          <aside className="order-summary">
            <p className="eyebrow">Resumo</p>
            <h2>Seu pedido</h2>
            <p>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </p>
            <div className="shipping-box">
              <label htmlFor="cep-bag">CEP de entrega</label>
              <div>
                <input
                  id="cep-bag"
                  value={cep}
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="00000-000"
                  onChange={(event) => setCep(event.target.value)}
                />
                <button type="button" onClick={calculate}>
                  Calcular
                </button>
              </div>
              {cepError && <p className="field-error">{cepError}</p>}
            </div>
            {shipping && (
              <p>
                <span>
                  {shipping.label}
                  <small>{shipping.estimate}</small>
                </span>
                <strong>{shipping.value ? money(shipping.value) : "Grátis"}</strong>
              </p>
            )}
            <p className="order-summary__total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </p>
            <Link className="button" href="/checkout">
              Continuar para entrega <Arrow />
            </Link>
            <small>
              Nenhuma cobrança é realizada antes da revisão final.
            </small>
          </aside>
        </section>
      )}
    </main>
  );
}

function CheckoutAssurances() {
  const items = [
    {
      label: "Dados temporários",
      text: "Nada é transmitido ou armazenado nesta experiência.",
      icon: (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="7" y="13" width="18" height="14" rx="2" />
          <path d="M11 13V9a5 5 0 0 1 10 0v4M16 19v3" />
        </svg>
      ),
    },
    {
      label: "Sem cobrança real",
      text: "As formas de pagamento são apenas demonstrativas.",
      icon: (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect x="4" y="7" width="24" height="18" rx="2" />
          <path d="M4 12h24M9 20h6" />
        </svg>
      ),
    },
    {
      label: "Resumo transparente",
      text: "Produtos, entrega e total permanecem visíveis.",
      icon: (
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M8 4h16v24l-4-2-4 2-4-2-4 2Z" />
          <path d="M12 11h8M12 16h8M12 21h5" />
        </svg>
      ),
    },
  ];

  return (
    <ul className="checkout-assurances" aria-label="Informações desta experiência">
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.icon}</span>
          <div>
            <strong>{item.label}</strong>
            <small>{item.text}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CheckoutPage({
  items,
  subtotal,
}: {
  items: CartItem[];
  subtotal: number;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    name: "",
    email: "",
    cep: "",
    address: "",
    city: "",
    state: "",
    payment: "",
  });
  const shipping = calculateShipping(data.cep, subtotal);
  const total = subtotal + (shipping?.value ?? 0);
  const steps = ["Identificação", "Entrega", "Pagamento", "Revisão"];

  const advance = () => {
    if (
      (step === 0 && (!data.name.trim() || !data.email.includes("@"))) ||
      (step === 1 &&
        (!calculateShipping(data.cep, subtotal) ||
          !data.address.trim() ||
          !data.city.trim() ||
          !data.state.trim())) ||
      (step === 2 && !data.payment)
    ) {
      setError("Preencha os campos desta etapa para continuar.");
      return;
    }
    setError("");
    setStep((value) => value + 1);
  };

  if (!items.length) {
    return (
      <main id="conteudo">
        <PageHero
          eyebrow="Checkout"
          title="Sua sacola está vazia."
          text="Adicione pelo menos um produto antes de continuar."
          image="/images/hq/presente-completo.webp"
          imageAlt="Seleção de presentes e produtos Nascente"
        />
        <section className="bag-empty">
          <Link className="button button--dark" href="/produtos">
            Voltar ao catálogo <Arrow />
          </Link>
        </section>
      </main>
    );
  }

  if (step === 4) {
    return (
      <main id="conteudo">
        <section className="confirmation confirmation--complete">
          <div className="confirmation__image">
            <Image
              unoptimized
              src="/images/hq/presente-completo.webp"
              alt="Composição de produtos Nascente para presente"
              fill
              priority
              sizes="(max-width: 860px) 100vw, 50vw"
            />
          </div>
          <div className="confirmation__content">
            <span className="confirmation__check" aria-hidden="true">✓</span>
            <p className="eyebrow">Experiência concluída</p>
            <h1>Seu ritual está organizado.</h1>
            <p>
              Esta demonstração foi concluída sem gerar cobrança, encomenda ou
              pedido. Os dados preenchidos não foram transmitidos nem
              armazenados.
            </p>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>Demonstração finalizada</dd>
              </div>
              <div>
                <dt>Total apresentado</dt>
                <dd>{money(total)}</dd>
              </div>
              <div>
                <dt>Próximo passo</dt>
                <dd>Voltar à loja ou explorar outra coleção</dd>
              </div>
            </dl>
            <div className="confirmation__actions">
              <Link className="button button--dark" href="/">
                Voltar ao início <Arrow />
              </Link>
              <Link className="text-link" href="/produtos">
                Continuar na loja
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="conteudo">
      <section className="checkout">
        <div className="checkout__main">
          <Link href="/" aria-label="Voltar à página inicial">
            <Mark />
          </Link>
          <ol className="checkout-steps" aria-label="Etapas do checkout">
            {steps.map((label, index) => (
              <li className={index <= step ? "is-active" : ""} key={label}>
                <span>{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="checkout-panel">
            {error && (
              <p className="form-alert form-alert--error" role="alert">
                {error}
              </p>
            )}
            {step === 0 && (
              <>
                <p className="eyebrow">Etapa 01</p>
                <h1>Como podemos identificar você?</h1>
                <label>
                  <span>Nome completo</span>
                  <input
                    value={data.name}
                    autoComplete="name"
                    onChange={(event) =>
                      setData((value) => ({ ...value, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={data.email}
                    autoComplete="email"
                    onChange={(event) =>
                      setData((value) => ({ ...value, email: event.target.value }))
                    }
                  />
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <p className="eyebrow">Etapa 02</p>
                <h1>Para onde o ritual seguiria?</h1>
                <label>
                  <span>CEP</span>
                  <input
                    value={data.cep}
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="00000-000"
                    onChange={(event) =>
                      setData((value) => ({ ...value, cep: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span>Endereço</span>
                  <input
                    value={data.address}
                    onChange={(event) =>
                      setData((value) => ({
                        ...value,
                        address: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="field-row">
                  <label>
                    <span>Cidade</span>
                    <input
                      value={data.city}
                      onChange={(event) =>
                        setData((value) => ({
                          ...value,
                          city: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>Estado</span>
                    <input
                      value={data.state}
                      maxLength={2}
                      onChange={(event) =>
                        setData((value) => ({
                          ...value,
                          state: event.target.value.toUpperCase(),
                        }))
                      }
                    />
                  </label>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="eyebrow">Etapa 03</p>
                <h1>Como você prefere pagar?</h1>
                <p className="checkout-note">
                  Não solicitamos dados de cartão, CPF ou credenciais
                  financeiras neste ambiente.
                </p>
                <div className="payment-options">
                  {["Cartão", "Pix"].map((option) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={data.payment === option}
                      onClick={() =>
                        setData((value) => ({ ...value, payment: option }))
                      }
                    >
                      <span>{option === "Cartão" ? "▭" : "◇"}</span>
                      <strong>{option}</strong>
                      <small>
                        {option === "Cartão"
                          ? "Opção visual, sem dados financeiros"
                          : "Opção visual, sem geração de cobrança"}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <p className="eyebrow">Etapa 04</p>
                <h1>Revise a experiência.</h1>
                <div className="review-grid">
                  <div>
                    <span>Identificação</span>
                    <strong>{data.name}</strong>
                    <small>{data.email}</small>
                  </div>
                  <div>
                    <span>Entrega</span>
                    <strong>{data.address}</strong>
                    <small>
                      {data.city} · {data.state} · {data.cep}
                    </small>
                  </div>
                  <div>
                    <span>Forma escolhida</span>
                    <strong>{data.payment}</strong>
                    <small>Sem processamento financeiro</small>
                  </div>
                </div>
              </>
            )}
            <div className="checkout-actions">
              {step > 0 && (
                <button type="button" onClick={() => setStep((value) => value - 1)}>
                  ← Voltar
                </button>
              )}
              <button type="button" className="button" onClick={advance}>
                {step === 3 ? "Concluir experiência" : "Continuar"} <Arrow />
              </button>
            </div>
          </div>
        </div>
        <aside className="checkout__summary">
          <p className="eyebrow">Resumo</p>
          <CheckoutAssurances />
          {items.map((item) => {
            const product = products.find((entry) => entry.id === item.productId);
            if (!product) return null;
            return (
              <div key={`${item.productId}-${item.size}`}>
                <span>
                  {item.quantity} × {product.name}
                </span>
                <strong>
                  {money(productPrice(product, item.size) * item.quantity)}
                </strong>
              </div>
            );
          })}
          <div>
            <span>Entrega</span>
            <strong>
              {shipping
                ? shipping.value
                  ? money(shipping.value)
                  : "Grátis"
                : "A calcular"}
            </strong>
          </div>
          <p>
            <span>Total</span>
            <strong>{money(total)}</strong>
          </p>
        </aside>
      </section>
    </main>
  );
}

function PoliciesPage() {
  return (
    <ContentPage
      eyebrow="Privacidade e termos"
      title="Clareza em cada interação."
      intro="Privacidade, condições de navegação e limites desta experiência reunidos em um único documento."
      color="blue"
      image="/images/hq/editorial-ritual.webp"
      imageAlt="Produtos Nascente organizados em um ritual de cuidado"
    >
      <div className="legal-overview">
        <p>Última atualização: 27 de julho de 2026.</p>
        <nav aria-label="Conteúdo desta página">
          <a href="#privacidade">
            <span>01</span>
            <strong>Privacidade</strong>
            <small>Dados locais, formulários e pagamento</small>
          </a>
          <a href="#termos">
            <span>02</span>
            <strong>Termos de uso</strong>
            <small>Navegação, produtos e conteúdo</small>
          </a>
        </nav>
      </div>
      <div className="legal-sections">
        <section id="privacidade">
          <p className="eyebrow">01 · Privacidade</p>
          <h2>Seus dados ficam sob seu controle.</h2>
          <div className="legal-grid">
            <article>
              <span>01</span>
              <h3>Sacola</h3>
              <p>
                A seleção utiliza o armazenamento local do navegador apenas
                para produto, variação, quantidade e embalagem. Ela pode ser
                apagada com os dados do navegador.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Checkout e contato</h3>
              <p>
                Os campos permanecem no estado temporário da página. Nenhuma
                informação preenchida é transmitida ou persistida nesta versão.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Pagamento</h3>
              <p>
                Não solicitamos número de cartão, código de segurança, CPF,
                senha, chave Pix ou qualquer credencial financeira.
              </p>
            </article>
          </div>
        </section>
        <section id="termos">
          <p className="eyebrow">02 · Termos de uso</p>
          <h2>Uma experiência para explorar com transparência.</h2>
          <div className="legal-grid">
            <article>
              <span>01</span>
              <h3>Produtos e conteúdo</h3>
              <p>
                Descrições sensoriais, preços, tamanhos e orientações compõem o
                universo editorial da Nascente e não constituem alegações
                médicas ou terapêuticas.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Compras</h3>
              <p>
                O fluxo de compra não gera cobrança, reserva, encomenda ou
                entrega. Nenhum pedido comercial é processado nesta versão.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Propriedade</h3>
              <p>
                Textos, sistema visual, fotografias e interface foram
                produzidos para este projeto. A navegação não autoriza a
                reprodução integral do conteúdo.
              </p>
            </article>
          </div>
        </section>
      </div>
      <div className="legal-note legal-note--centered">
        <strong>Sobre esta versão</strong>
        <p>
          A Nascente é uma marca conceitual apresentada no portfólio da Varanda
          Estúdio Web. Dúvidas podem ser encaminhadas para{" "}
          <a href="mailto:atendimento@nascentecasa.com.br">
            atendimento@nascentecasa.com.br
          </a>
          .
        </p>
      </div>
    </ContentPage>
  );
}

function NotFoundPage() {
  return (
    <main id="conteudo">
      <section className="not-found">
        <span>404</span>
        <p className="eyebrow">Caminho não encontrado</p>
        <h1>Essa atmosfera ainda não existe.</h1>
        <p>Volte ao início ou explore as três coleções da Nascente.</p>
        <Link className="button button--dark" href="/">
          Voltar ao início <Arrow />
        </Link>
      </section>
    </main>
  );
}

export default function Storefront({ route }: { route: string[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(CART_KEY);
        if (stored) setCart(JSON.parse(stored) as CartItem[]);
      } catch {
        window.localStorage.removeItem(CART_KEY);
      } finally {
        setCartReady(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, cartReady]);

  const subtotal = useMemo(
    () =>
      cart.reduce((total, item) => {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) return total;
        return (
          total +
          productPrice(product, item.size) * item.quantity +
          (item.gift ? 12 : 0)
        );
      }, 0),
    [cart],
  );

  const count = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart],
  );

  const updateCart = useCallback(
    (updater: (current: CartItem[]) => CartItem[]) => {
      setCart((current) => {
        const next = updater(current);
        try {
          window.localStorage.setItem(CART_KEY, JSON.stringify(next));
        } catch {
          // A sacola continua funcional durante a sessão quando o navegador
          // bloqueia armazenamento local.
        }
        return next;
      });
    },
    [],
  );

  const addConfigured = useCallback(
    (product: Product, size: string, quantity: number) => {
      updateCart((current) => {
        const index = current.findIndex(
          (item) =>
            item.productId === product.id && item.size === size && !item.gift,
        );
        if (index === -1) {
          return [
            ...current,
            { productId: product.id, size, quantity, gift: false },
          ];
        }
        return current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      });
      setStatus(`${product.name} foi adicionado à sacola.`);
      setCartOpen(true);
    },
    [updateCart],
  );

  const addDefault = useCallback(
    (product: Product) => {
      const size =
        product.sizes.find((option) => option.available)?.label ??
        product.sizes[0].label;
      addConfigured(product, size, 1);
    },
    [addConfigured],
  );

  const updateQuantity = (index: number, quantity: number) =>
    updateCart((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity } : item,
      ),
    );

  const remove = (index: number) => {
    updateCart((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setStatus("Item removido da sacola.");
  };

  const toggleGift = (index: number, gift: boolean) =>
    updateCart((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, gift } : item,
      ),
    );

  const key = route.join("/");
  let page: ReactNode;

  if (!key) page = <Home onAdd={addDefault} />;
  else if (key === "produtos") page = <Catalog onAdd={addDefault} />;
  else if (key === "colecoes") page = <CollectionsPage />;
  else if (key === "guia-olfativo") page = <GuidePage />;
  else if (key === "sobre") page = <AboutPage />;
  else if (key === "ajuda") page = <HelpPage />;
  else if (key === "entregas-e-trocas") page = <HelpPage />;
  else if (key === "contato") page = <ContactPage />;
  else if (
    key === "politicas" ||
    key === "privacidade" ||
    key === "termos"
  )
    page = <PoliciesPage />;
  else if (key === "sacola")
    page = (
      <BagPage
        items={cart}
        subtotal={subtotal}
        onQuantity={updateQuantity}
        onRemove={remove}
        onGift={toggleGift}
      />
    );
  else if (key === "checkout")
    page = <CheckoutPage items={cart} subtotal={subtotal} />;
  else if (route[0] === "produtos" && route[1]) {
    const product = productBySlug(route[1]);
    page = product ? (
      <ProductPage product={product} onAddConfigured={addConfigured} />
    ) : (
      <NotFoundPage />
    );
  } else if (route[0] === "colecoes" && route[1]) {
    const collection = collectionBySlug(route[1]);
    page = collection ? (
      <CollectionPage collection={collection} onAdd={addDefault} />
    ) : (
      <NotFoundPage />
    );
  } else page = <NotFoundPage />;

  const isCheckout = key === "checkout";
  const headerOverMedia =
    !key ||
    [
      "produtos",
      "colecoes",
      "guia-olfativo",
      "sobre",
      "ajuda",
      "entregas-e-trocas",
      "contato",
      "sacola",
      "politicas",
      "privacidade",
      "termos",
    ].includes(key) ||
    route[0] === "colecoes";

  return (
    <>
      {!isCheckout && (
        <Header
          count={count}
          onCart={() => setCartOpen(true)}
          transparent={headerOverMedia}
        />
      )}
      {page}
      {!isCheckout && <Footer />}
      <CartDrawer
        open={cartOpen}
        items={cart}
        subtotal={subtotal}
        onClose={() => setCartOpen(false)}
        onQuantity={updateQuantity}
        onRemove={remove}
      />
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </>
  );
}
