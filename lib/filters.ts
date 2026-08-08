import type { Product } from "./catalog";
import { products } from "./catalog";

export type SortKey = "destaque" | "novidades" | "preco-asc" | "preco-desc" | "nome";
export type PriceBand = "ate-60" | "60-120" | "acima-120";

export interface FilterState {
  categorias: string[];
  colecoes: string[];
  intensidades: number[];
  faixas: PriceBand[];
  busca: string;
  ordem: SortKey;
}

export const EMPTY_FILTERS: FilterState = {
  categorias: [],
  colecoes: [],
  intensidades: [],
  faixas: [],
  busca: "",
  ordem: "destaque",
};

export const PRICE_BANDS: { id: PriceBand; label: string }[] = [
  { id: "ate-60", label: "Até R$ 60" },
  { id: "60-120", label: "R$ 60 a R$ 120" },
  { id: "acima-120", label: "Acima de R$ 120" },
];

export const INTENSITY_LEVELS: { value: number; label: string }[] = [
  { value: 2, label: "Suave" },
  { value: 3, label: "Média" },
  { value: 4, label: "Marcante" },
];

export const CATEGORIES = ["Perfumaria", "Corpo", "Casa", "Presentes"] as const;

function lowestPrice(product: Product): number {
  return Math.min(...product.sizes.map((s) => s.price));
}

function inBand(price: number, band: PriceBand): boolean {
  if (band === "ate-60") return price <= 60;
  if (band === "60-120") return price > 60 && price <= 120;
  return price > 120;
}

/** Normaliza para busca tolerante a acento: "colonia" encontra "Colônia". */
function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function applyFilters(state: FilterState, source: Product[] = products): Product[] {
  let result = source;

  if (state.categorias.length) {
    result = result.filter((p) => state.categorias.includes(p.category));
  }
  if (state.colecoes.length) {
    result = result.filter((p) => state.colecoes.includes(p.collection));
  }
  if (state.intensidades.length) {
    result = result.filter((p) => state.intensidades.includes(p.intensity));
  }
  if (state.faixas.length) {
    result = result.filter((p) => state.faixas.some((band) => inBand(lowestPrice(p), band)));
  }

  const term = fold(state.busca.trim());
  if (term) {
    result = result.filter((p) =>
      [p.name, p.description, p.family, ...p.notes, ...p.occasion]
        .some((field) => fold(field).includes(term)),
    );
  }

  const sorted = [...result];
  switch (state.ordem) {
    case "preco-asc":
      sorted.sort((a, b) => lowestPrice(a) - lowestPrice(b));
      break;
    case "preco-desc":
      sorted.sort((a, b) => lowestPrice(b) - lowestPrice(a));
      break;
    case "nome":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
    case "novidades":
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
      break;
    default:
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }
  return sorted;
}

export function activeFilterCount(state: FilterState): number {
  return (
    state.categorias.length +
    state.colecoes.length +
    state.intensidades.length +
    state.faixas.length
  );
}

/** Rótulos legíveis das etiquetas de filtro ativo. */
export function describeFilters(state: FilterState, collectionName: (slug: string) => string) {
  return [
    ...state.categorias.map((v) => ({ group: "categorias" as const, value: v, label: v })),
    ...state.colecoes.map((v) => ({ group: "colecoes" as const, value: v, label: collectionName(v) })),
    ...state.intensidades.map((v) => ({
      group: "intensidades" as const,
      value: v,
      label: INTENSITY_LEVELS.find((i) => i.value === v)?.label ?? String(v),
    })),
    ...state.faixas.map((v) => ({
      group: "faixas" as const,
      value: v,
      label: PRICE_BANDS.find((b) => b.id === v)?.label ?? v,
    })),
  ];
}
