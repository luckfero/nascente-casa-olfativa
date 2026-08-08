"use client";

import Link from "next/link";
import { money, type Product } from "@/lib/catalog";
import { SIZES } from "@/lib/images";
import { useCart } from "./cart";
import { Picture } from "./ui";

export function ProductCard({
  product,
  sizes = SIZES.card,
  priority,
}: {
  product: Product;
  sizes?: string;
  priority?: boolean;
}) {
  const { addDefault } = useCart();
  const available = product.sizes.some((option) => option.available);
  const from = Math.min(...product.sizes.map((option) => option.price));
  const hasRange = product.sizes.length > 1;

  return (
    <article className="pcard">
      <div className="pcard__media">
        <Picture src={product.image} alt={product.name} sizes={sizes} priority={priority} />

        {!available && <span className="pcard__flag pcard__flag--out">Esgotado</span>}
        {available && product.featured && <span className="pcard__flag">Destaque</span>}

        {available && (
          <div className="pcard__quick">
            <button
              type="button"
              className="btn btn--paper btn--block btn--sm"
              onClick={() => addDefault(product)}
            >
              <span>Adicionar à sacola</span>
            </button>
          </div>
        )}
      </div>

      <div className="pcard__body">
        <p className="eyebrow">{product.category} · {product.family}</p>
        <h3 className="pcard__name">
          <Link href={`/produtos/${product.slug}`} className="pcard__link">
            {product.name}
          </Link>
        </h3>
        <p className="pcard__desc">{product.description}</p>
        <p className="pcard__price">
          {hasRange ? `A partir de ${money(from)}` : money(from)}
        </p>
      </div>
    </article>
  );
}
