"use client";

import Link from "next/link";
import { useState } from "react";
import { collectionBySlug, money, products, type Product } from "@/lib/catalog";
import { NOTE_ROLES } from "@/lib/guide";
import { SIZES } from "@/lib/images";
import { formatCep, quoteShipping, FREE_SHIPPING_FROM } from "@/lib/shipping";
import { useCart } from "./cart";
import { Intensity, Picture, Reveal, Stepper } from "./ui";
import { ProductCard } from "./product-card";

export function ProductPage({ product }: { product: Product }) {
  const { add } = useCart();
  const collection = collectionBySlug(product.collection);

  const firstAvailable = product.sizes.find((size) => size.available) ?? product.sizes[0];
  const [size, setSize] = useState(firstAvailable.label);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = product.sizes.find((option) => option.label === size) ?? firstAvailable;
  const soldOut = !selected.available;
  const related = products
    .filter((entry) => entry.collection === product.collection && entry.id !== product.id)
    .slice(0, 4);

  function handleAdd() {
    if (soldOut) return;
    add(product, size, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  }

  return (
    <main id="conteudo" className="shell">
      <nav className="crumbs" aria-label="Você está em">
        <Link href="/produtos">Loja</Link>
        <span aria-hidden="true">/</span>
        {collection && (
          <>
            <Link href={`/colecoes/${collection.slug}`}>{collection.name}</Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product">
        <div className="product__media">
          <figure>
            <Picture
              src={product.image}
              alt={`${product.name} — ${product.description}`}
              sizes={SIZES.product}
              priority
            />
          </figure>
        </div>

        <div className="product__info">
          <div>
            <p className="eyebrow">
              {product.category} · {collection?.name ?? product.family}
            </p>
            <h1 className="product__title">{product.name}</h1>
          </div>

          <p className="product__price">{money(selected.price)}</p>
          <p className="product__desc">{product.description}</p>

          {product.sizes.length > 1 && (
            <fieldset className="options">
              <legend className="eyebrow">Tamanho</legend>
              <div className="options__row">
                {product.sizes.map((option) => (
                  <label className="option" key={option.label}>
                    <input
                      type="radio"
                      name="tamanho"
                      value={option.label}
                      checked={size === option.label}
                      disabled={!option.available}
                      onChange={() => {
                        setSize(option.label);
                        setAdded(false);
                      }}
                    />
                    {option.label}
                    <span className="option__price">{money(option.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {soldOut && (
            <p className="alert" role="status">
              <strong>Este tamanho está esgotado.</strong>
              Escolha outra opção ou avise-nos pelo atendimento.
            </p>
          )}

          <div className="buy-row">
            <Stepper value={quantity} onChange={setQuantity} label={product.name} />
            <button type="button" className="btn" onClick={handleAdd} disabled={soldOut}>
              <span>
                {soldOut ? "Indisponível" : `Adicionar · ${money(selected.price * quantity)}`}
              </span>
            </button>
          </div>

          {added && (
            <p className="added-note" role="status">
              Adicionado à sacola. <Link href="/sacola" className="link link--static">Ver sacola</Link>
            </p>
          )}

          <ShippingBox subtotal={selected.price * quantity} />

          <div className="scent">
            <h2 className="eyebrow">Perfil olfativo</h2>
            <ol className="notes-list">
              {product.notes.map((note, index) => (
                <li key={note}>
                  <span className="notes-list__step">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="notes-list__role">{NOTE_ROLES[index] ?? "Nota"}</span>
                    <span className="notes-list__name">{note}</span>
                  </span>
                </li>
              ))}
            </ol>

            <Intensity level={product.intensity} />

            <dl className="spec-grid">
              <div>
                <dt>Família</dt>
                <dd>{product.family}</dd>
              </div>
              <div>
                <dt>Para quando</dt>
                <dd>{product.occasion.join(" · ")}</dd>
              </div>
              <div>
                <dt>Modo de usar</dt>
                <dd>{product.use}</dd>
              </div>
              <div>
                <dt>Cuidados</dt>
                <dd>{product.care}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Na mesma atmosfera</p>
              <h2>Continue a coleção.</h2>
            </div>
            {collection && (
              <Link href={`/colecoes/${collection.slug}`} className="link">
                Ver {collection.name}
              </Link>
            )}
          </div>
          <div className="grid-products grid-products--4">
            {related.map((entry, index) => (
              <Reveal key={entry.id} as="div" delay={index * 60}>
                <ProductCard product={entry} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ------------------------------------------------------- frete por CEP ---- */

export function ShippingBox({ subtotal }: { subtotal: number }) {
  const [cep, setCep] = useState("");
  const [touched, setTouched] = useState(false);
  const state = quoteShipping(cep, subtotal);
  const showError = touched && state.status === "invalid";

  return (
    <div className="shipping">
      <div className="shipping__row">
        <div className="field">
          <label htmlFor="cep-produto">Entrega e prazo</label>
          <input
            id="cep-produto"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            aria-invalid={showError}
            aria-describedby={showError ? "cep-produto-erro" : "cep-produto-nota"}
            onChange={(event) => setCep(formatCep(event.target.value))}
            onBlur={() => setTouched(true)}
          />
        </div>
      </div>

      {showError && (
        <p className="field-error" id="cep-produto-erro" role="alert">
          CEP incompleto. Use o formato 00000-000.
        </p>
      )}

      {state.status === "ok" && (
        <p className="shipping__result" role="status">
          {state.quote.free ? (
            <>
              <strong>Frete cortesia</strong> para {state.quote.region}
            </>
          ) : (
            <>
              <strong>{money(state.quote.price)}</strong> para {state.quote.region}
            </>
          )}{" "}
          · {state.quote.minDays} a {state.quote.maxDays} dias úteis.
        </p>
      )}

      <p className="field-hint" id="cep-produto-nota">
        Estimativa ilustrativa. Frete cortesia a partir de {money(FREE_SHIPPING_FROM)}.
      </p>
    </div>
  );
}
