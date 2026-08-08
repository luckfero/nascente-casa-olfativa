"use client";

import Link from "next/link";
import { collections, products } from "@/lib/catalog";
import { SIZES } from "@/lib/images";
import { Picture, Reveal } from "./ui";
import { ProductCard } from "./product-card";

const VALUES = [
  {
    title: "Criação autoral",
    text: "Três famílias olfativas desenvolvidas pela casa, sem fórmulas licenciadas.",
  },
  {
    title: "Pequenos lotes",
    text: "Produção fracionada para manter frescor e controle em cada etapa.",
  },
  {
    title: "Matéria que dura",
    text: "Vidro âmbar, madeira e papel escolhidos para durar depois da compra.",
  },
];

export function HomePage() {
  const featured = products.filter((product) => product.featured).slice(0, 4);

  return (
    <main id="conteudo">
      {/* ---- Hero ---- */}
      <section className="hero">
        <div className="hero__media">
          <Picture
            src="/images/hq/hero-central-nascente.webp"
            alt="Frasco Nascente em vidro âmbar sobre pedra molhada, entre folhas escuras e bergamota partida"
            sizes={SIZES.full}
            priority
          />
        </div>

        <div className="hero__copy">
          <p className="eyebrow">Coleção Chuva Clara</p>
          <h1 className="hero__title">
            O perfume da chuva <em>sobre a terra.</em>
          </h1>
          <div className="hero__actions">
            <Link href="/produtos/colonia-chuva-clara" className="btn btn--on-dark">
              <span>Descobrir a fragrância</span>
            </Link>
            <Link href="/colecoes/chuva-clara" className="btn btn--ghost btn--on-media">
              <span>Explorar a coleção</span>
            </Link>
          </div>
        </div>
        <p className="hero__scroll" aria-hidden="true">Role</p>
      </section>

      {/* ---- Destaques ---- */}
      <section className="shell section">
        <Reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">A casa olfativa</p>
              <h2>Fragrâncias para a pele, a casa e a memória.</h2>
            </div>
            <Link href="/produtos" className="link">Ver tudo</Link>
          </div>
        </Reveal>

        <div className="grid-products grid-products--4">
          {featured.map((product, index) => (
            <Reveal key={product.id} as="div" delay={index * 70}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- Coleções ---- */}
      <section className="shell section" id="colecoes">
        <Reveal>
          <div className="section-head">
            <div>
              <p className="eyebrow">Três atmosferas</p>
              <h2>Um mesmo aroma, do banho à sala.</h2>
            </div>
            <Link href="/colecoes" className="link">Ver coleções</Link>
          </div>
        </Reveal>

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
      </section>

      {/* ---- Ritual ---- */}
      <section className="shell section">
        <Reveal>
          <div className="editorial">
            <div className="editorial__media">
              <Picture
                src="/images/hq/editorial-ritual.webp"
                alt="Sabonete líquido, colônia e vela Nascente sobre bancada de travertino, ao lado de vaso de terracota"
                sizes={SIZES.half}
              />
            </div>
            <div className="editorial__body">
              <p className="eyebrow">Seu ritual, sua escolha</p>
              <h2>Do banho à casa pronta para receber.</h2>
              <p>
                Camadas de aroma criadas para acompanhar o corpo, habitar os
                espaços e atravessar o dia sem pressa.
              </p>
              <ul className="value-list">
                {VALUES.map((value, index) => (
                  <li key={value.title}>
                    <span className="value-list__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{value.title}</strong>
                      <span>{value.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---- Guia ---- */}
      <section className="feature-band">
        <div className="feature-band__media">
          <Picture
            src="/images/hq/editorial-materias.webp"
            alt="Bergamota, chá preto, resinas e madeiras dispostos como referências olfativas"
            sizes={SIZES.full}
          />
        </div>
        <div className="shell">
          <Reveal>
            <div className="feature-band__body">
              <p className="eyebrow" style={{ color: "rgba(247,242,233,.7)" }}>Guia olfativo</p>
              <h2>Não é preciso sentir antes para escolher bem.</h2>
              <p>
                Conte como você quer se sentir e em que momento pretende usar.
                O guia aproxima você da família que faz mais sentido — sem
                exigir vocabulário técnico.
              </p>
              <Link href="/guia-olfativo" className="btn btn--on-dark">
                <span>Encontrar meu aroma</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
