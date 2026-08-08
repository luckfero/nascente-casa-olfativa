"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { collections, products, type Collection } from "@/lib/catalog";
import {
  activeFilterCount,
  applyFilters,
  CATEGORIES,
  describeFilters,
  EMPTY_FILTERS,
  INTENSITY_LEVELS,
  PRICE_BANDS,
  type FilterState,
  type PriceBand,
  type SortKey,
} from "@/lib/filters";
import { SIZES } from "@/lib/images";
import { Picture, Reveal } from "./ui";
import { ProductCard } from "./product-card";

type ListGroup = "categorias" | "colecoes" | "intensidades" | "faixas";

const collectionName = (slug: string) =>
  collections.find((entry) => entry.slug === slug)?.name ?? slug;

/** Lê o estado inicial da URL para que links como /produtos?categoria=Presentes funcionem. */
function readInitialFilters(): FilterState {
  if (typeof window === "undefined") return EMPTY_FILTERS;
  const params = new URLSearchParams(window.location.search);
  const list = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  return {
    categorias: list("categoria"),
    colecoes: list("colecao"),
    intensidades: list("intensidade").map(Number).filter(Number.isFinite),
    faixas: list("preco") as PriceBand[],
    busca: params.get("q") ?? "",
    ordem: (params.get("ordem") as SortKey) ?? "destaque",
  };
}

export function CatalogPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [hydrated, setHydrated] = useState(false);

  /* A URL só é lida depois da montagem: durante o render do servidor não há
     window, e ler ali produziria HTML divergente do cliente. O agendamento
     tira o setState do corpo síncrono do efeito. */
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setFilters(readInitialFilters());
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Espelha o estado de volta na URL para a página ser compartilhável e o
     botão Voltar do navegador não perder os filtros.
     Só depois da hidratação: rodando na montagem, este efeito gravava a URL
     com o estado vazio e apagava a busca antes de ela ser lida. */
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (filters.categorias.length) params.set("categoria", filters.categorias.join(","));
    if (filters.colecoes.length) params.set("colecao", filters.colecoes.join(","));
    if (filters.intensidades.length) params.set("intensidade", filters.intensidades.join(","));
    if (filters.faixas.length) params.set("preco", filters.faixas.join(","));
    if (filters.busca) params.set("q", filters.busca);
    if (filters.ordem !== "destaque") params.set("ordem", filters.ordem);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filters, hydrated]);

  /* Buscar estando já em /produtos não remonta a página, então o termo vindo
     da barra do topo é acompanhado pelo roteador. O espelhamento na URL usa
     replaceState, que não mexe no estado do roteador — não há laço aqui. */
  const routedQuery = useSearchParams().get("q") ?? "";
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setFilters((current) =>
        current.busca === routedQuery ? current : { ...current, busca: routedQuery },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [routedQuery]);

  const results = useMemo(() => applyFilters(filters), [filters]);
  const active = activeFilterCount(filters);
  const tags = describeFilters(filters, collectionName);

  function toggle(group: ListGroup, value: string | number) {
    setFilters((current) => {
      const list = current[group] as (string | number)[];
      const next = list.includes(value)
        ? list.filter((entry) => entry !== value)
        : [...list, value];
      return { ...current, [group]: next };
    });
  }

  const panel = (
    <div className="filters">
      <div className="filters__group">
        <h2>Categoria</h2>
        {CATEGORIES.map((category) => (
          <label key={category}>
            <input
              type="checkbox"
              checked={filters.categorias.includes(category)}
              onChange={() => toggle("categorias", category)}
            />
            {category}
          </label>
        ))}
      </div>

      <div className="filters__group">
        <h2>Coleção</h2>
        {collections.map((collection) => (
          <label key={collection.slug}>
            <input
              type="checkbox"
              checked={filters.colecoes.includes(collection.slug)}
              onChange={() => toggle("colecoes", collection.slug)}
            />
            {collection.name}
          </label>
        ))}
      </div>

      <div className="filters__group">
        <h2>Intensidade</h2>
        {INTENSITY_LEVELS.map((level) => (
          <label key={level.value}>
            <input
              type="checkbox"
              checked={filters.intensidades.includes(level.value)}
              onChange={() => toggle("intensidades", level.value)}
            />
            {level.label}
          </label>
        ))}
      </div>

      <div className="filters__group">
        <h2>Preço</h2>
        {PRICE_BANDS.map((band) => (
          <label key={band.id}>
            <input
              type="checkbox"
              checked={filters.faixas.includes(band.id)}
              onChange={() => toggle("faixas", band.id)}
            />
            {band.label}
          </label>
        ))}
      </div>

      {active > 0 && (
        <button
          type="button"
          className="filters__clear"
          onClick={() => setFilters((current) => ({ ...EMPTY_FILTERS, busca: current.busca, ordem: current.ordem }))}
        >
          Limpar filtros ({active})
        </button>
      )}
    </div>
  );

  return (
    <main id="conteudo" className="shell">
      <div className="page-hero">
        <p className="eyebrow">Loja</p>
        <h1>{filters.busca ? `Resultados para “${filters.busca}”` : "Todos os produtos"}</h1>
        <p className="lede">
          Colônias, cuidados para o corpo, perfumação de ambiente e presentes —
          organizados por coleção, intensidade e momento de uso.
        </p>
      </div>

      <div className="toolbar">
        <p className="toolbar__count" aria-live="polite">
          {results.length} {results.length === 1 ? "produto" : "produtos"}
        </p>
        <div className="toolbar__right">
          <label style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", fontSize: "var(--t-sm)" }}>
            Ordenar
            <select
              value={filters.ordem}
              onChange={(event) =>
                setFilters((current) => ({ ...current, ordem: event.target.value as SortKey }))
              }
            >
              <option value="destaque">Destaque</option>
              <option value="novidades">Novidades</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="nome">Nome</option>
            </select>
          </label>
        </div>
      </div>

      {tags.length > 0 && (
        <ul className="chips">
          {tags.map((tag) => (
            <li className="chip" key={`${tag.group}-${tag.value}`}>
              {tag.label}
              <button
                type="button"
                onClick={() => toggle(tag.group, tag.value)}
                aria-label={`Remover filtro ${tag.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="catalog">
        <details className="filters-mobile">
          <summary>
            Filtrar{active > 0 ? ` (${active})` : ""}
            <span aria-hidden="true">+</span>
          </summary>
          {panel}
        </details>

        <aside aria-label="Filtros">{panel}</aside>

        <div className="grid-products">
          {results.length === 0 ? (
            <div className="empty-state">
              <h2>Nenhum produto encontrado</h2>
              <p>
                Tente remover um filtro ou buscar por outra palavra. O guia
                olfativo também pode indicar um caminho.
              </p>
              <Link href="/guia-olfativo" className="btn btn--ghost">
                <span>Abrir o guia olfativo</span>
              </Link>
            </div>
          ) : (
            results.map((product, index) => (
              <Reveal key={product.id} as="div" delay={Math.min(index, 7) * 55}>
                <ProductCard product={product} />
              </Reveal>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------ lista de coleções -- */

export function CollectionsPage() {
  return (
    <main id="conteudo" className="shell">
      <div className="page-hero">
        <p className="eyebrow">Coleções</p>
        <h1>Três atmosferas, um mesmo cuidado.</h1>
        <p className="lede">
          Cada coleção nasce de uma sensação, não de um ingrediente. A mesma
          fragrância atravessa colônia, corpo e casa.
        </p>
      </div>

      <div className="section">
        <div className="collections">
          {collections.map((collection, index) => (
            <Reveal key={collection.slug} as="article" delay={index * 90}>
              <article className="collection-card">
                <div className="collection-card__media">
                  <Picture
                    src={collection.image}
                    alt={`Produtos da coleção ${collection.name}`}
                    sizes={SIZES.collection}
                  />
                </div>
                <p className="eyebrow">{collection.family}</p>
                <h3>
                  <Link href={`/colecoes/${collection.slug}`} className="collection-card__link">
                    {collection.name}
                  </Link>
                </h3>
                <p>{collection.description}</p>
                <ul className="collection-card__notes">
                  {collection.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}

/* --------------------------------------------------- coleção individual --- */

export function CollectionPage({ collection }: { collection: Collection }) {
  const items = products.filter((product) => product.collection === collection.slug);
  const siblings = collections.filter((entry) => entry.slug !== collection.slug);

  return (
    <main id="conteudo">
      <section className="hero" style={{ minHeight: "min(70svh, 40rem)" }}>
        <div className="hero__media">
          <Picture
            src={collection.heroImage}
            alt={`Composição da coleção ${collection.name}`}
            sizes={SIZES.full}
            priority
          />
        </div>
        <div className="hero__copy">
          <p className="eyebrow">{collection.family}</p>
          <h1 className="hero__title">{collection.name}</h1>
          <p className="hero__lede">{collection.description}</p>
          <ul className="collection-card__notes">
            {collection.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="shell section">
        <div className="section-head">
          <div>
            <p className="eyebrow">A coleção completa</p>
            <h2>{items.length} produtos nesta atmosfera.</h2>
          </div>
          <Link href="/produtos" className="link">Ver toda a loja</Link>
        </div>

        <div className="grid-products grid-products--4">
          {items.map((product, index) => (
            <Reveal key={product.id} as="div" delay={index * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>

      <div className="shell section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Continue explorando</p>
            <h2>Outras atmosferas.</h2>
          </div>
        </div>
        <div className="collections" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {siblings.map((entry) => (
            <article className="collection-card" key={entry.slug}>
              <div className="collection-card__media">
                <Picture src={entry.image} alt={`Coleção ${entry.name}`} sizes={SIZES.half} />
              </div>
              <p className="eyebrow">{entry.family}</p>
              <h3>
                <Link href={`/colecoes/${entry.slug}`} className="collection-card__link">
                  {entry.name}
                </Link>
              </h3>
              <p>{entry.description}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
