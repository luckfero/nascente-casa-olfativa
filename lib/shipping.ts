/**
 * Estimativa ilustrativa de frete a partir do CEP.
 *
 * Não há chamada de rede: a faixa vem do primeiro dígito do CEP, que já
 * corresponde à macrorregião nos Correios. É demonstração — a interface diz
 * isso ao usuário em vez de fingir uma cotação real.
 */

export const FREE_SHIPPING_FROM = 260;

interface Region {
  name: string;
  price: number;
  days: number;
}

const REGIONS: Record<string, Region> = {
  "0": { name: "Grande São Paulo", price: 16.9, days: 2 },
  "1": { name: "Interior de São Paulo", price: 21.9, days: 3 },
  "2": { name: "Rio de Janeiro e Espírito Santo", price: 26.9, days: 4 },
  "3": { name: "Minas Gerais", price: 24.9, days: 4 },
  "4": { name: "Bahia e Sergipe", price: 31.9, days: 5 },
  "5": { name: "Pernambuco e região", price: 34.9, days: 6 },
  "6": { name: "Norte e Nordeste", price: 38.9, days: 7 },
  "7": { name: "Centro-Oeste e Distrito Federal", price: 29.9, days: 5 },
  "8": { name: "Paraná e Santa Catarina", price: 23.9, days: 3 },
  "9": { name: "Rio Grande do Sul", price: 28.9, days: 4 },
};

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function isValidCep(value: string): boolean {
  return /^\d{5}-?\d{3}$/.test(value.trim());
}

export interface ShippingQuote {
  region: string;
  price: number;
  free: boolean;
  minDays: number;
  maxDays: number;
}

export type ShippingState =
  | { status: "idle" }
  | { status: "invalid" }
  | { status: "ok"; quote: ShippingQuote };

export function quoteShipping(cep: string, subtotal: number): ShippingState {
  if (!cep.trim()) return { status: "idle" };
  if (!isValidCep(cep)) return { status: "invalid" };

  const region = REGIONS[cep.replace(/\D/g, "").charAt(0)] ?? REGIONS["0"];
  const free = subtotal >= FREE_SHIPPING_FROM;

  return {
    status: "ok",
    quote: {
      region: region.name,
      price: free ? 0 : region.price,
      free,
      minDays: region.days,
      maxDays: region.days + 2,
    },
  };
}
