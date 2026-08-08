"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { products, type Product } from "@/lib/catalog";

const STORAGE_KEY = "nascente:sacola";
export const GIFT_WRAP_PRICE = 12;

export interface CartItem {
  productId: string;
  size: string;
  quantity: number;
  gift: boolean;
}

export interface ResolvedItem extends CartItem {
  product: Product;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  key: string;
}

interface CartApi {
  items: CartItem[];
  resolved: ResolvedItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  add: (product: Product, size: string, quantity?: number) => void;
  addDefault: (product: Product) => void;
  setQuantity: (key: string, quantity: number) => void;
  setGift: (key: string, gift: boolean) => void;
  remove: (key: string) => void;
  clear: () => void;
  announce: (message: string) => void;
}

const CartContext = createContext<CartApi | null>(null);

export function useCart(): CartApi {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return context;
}

const itemKey = (item: CartItem) => `${item.productId}::${item.size}`;

function priceOf(product: Product, size: string): number {
  return product.sizes.find((option) => option.label === size)?.price ?? product.price;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const messageTimer = useRef<number | undefined>(undefined);

  /* Lê o armazenamento só depois da hidratação: ler durante a renderização do
     servidor produziria HTML diferente do cliente.
     A leitura é agendada fora do corpo síncrono do efeito para não encadear
     um segundo render dentro do mesmo commit. */
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* Navegador com armazenamento bloqueado: a sacola segue válida na sessão. */
    }
  }, [items, hydrated]);

  const announce = useCallback((next: string) => {
    setMessage("");
    window.clearTimeout(messageTimer.current);
    messageTimer.current = window.setTimeout(() => setMessage(next), 60);
  }, []);

  useEffect(() => () => window.clearTimeout(messageTimer.current), []);

  const add = useCallback(
    (product: Product, size: string, quantity = 1) => {
      setItems((current) => {
        const index = current.findIndex(
          (item) => item.productId === product.id && item.size === size,
        );
        if (index === -1) {
          return [...current, { productId: product.id, size, quantity, gift: false }];
        }
        return current.map((item, i) =>
          i === index ? { ...item, quantity: item.quantity + quantity } : item,
        );
      });
      announce(`${product.name}, ${size}, adicionado à sacola.`);
      setOpen(true);
    },
    [announce],
  );

  const addDefault = useCallback(
    (product: Product) => {
      const size =
        product.sizes.find((option) => option.available)?.label ?? product.sizes[0].label;
      add(product, size, 1);
    },
    [add],
  );

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => itemKey(item) !== key)
        : current.map((item) => (itemKey(item) === key ? { ...item, quantity } : item)),
    );
  }, []);

  const setGift = useCallback((key: string, gift: boolean) => {
    setItems((current) =>
      current.map((item) => (itemKey(item) === key ? { ...item, gift } : item)),
    );
  }, []);

  const remove = useCallback(
    (key: string) => {
      setItems((current) => current.filter((item) => itemKey(item) !== key));
      announce("Item removido da sacola.");
    },
    [announce],
  );

  const clear = useCallback(() => setItems([]), []);

  const resolved = useMemo<ResolvedItem[]>(() => {
    return items.flatMap((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) return [];
      const size = product.sizes.find((option) => option.label === item.size);
      const unitPrice = priceOf(product, item.size) + (item.gift ? GIFT_WRAP_PRICE : 0);
      return [
        {
          ...item,
          product,
          unitPrice,
          lineTotal: unitPrice * item.quantity,
          available: size?.available ?? false,
          key: itemKey(item),
        },
      ];
    });
  }, [items]);

  const count = resolved.reduce((total, item) => total + item.quantity, 0);
  const subtotal = resolved.reduce((total, item) => total + item.lineTotal, 0);

  const api: CartApi = {
    items,
    resolved,
    count,
    subtotal,
    open,
    setOpen,
    add,
    addDefault,
    setQuantity,
    setGift,
    remove,
    clear,
    announce,
  };

  return (
    <CartContext.Provider value={api}>
      {children}
      {/* Região viva única do site: toda mudança de sacola é falada aqui. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {message}
      </p>
    </CartContext.Provider>
  );
}
