"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/catalog";
import { SIZES } from "@/lib/images";
import { formatCep, isValidCep, quoteShipping, FREE_SHIPPING_FROM } from "@/lib/shipping";
import { useCart, GIFT_WRAP_PRICE } from "./cart";
import { Picture, Stepper } from "./ui";
import { ShippingBox } from "./page-product";

/* ------------------------------------------------------------- a sacola --- */

export function BagPage() {
  const { resolved, subtotal, setQuantity, setGift, remove } = useCart();

  if (resolved.length === 0) {
    return (
      <main id="conteudo" className="shell">
        <div className="empty-state" style={{ paddingBlock: "var(--s-10)" }}>
          <h1 style={{ fontSize: "var(--t-xl)" }}>Sua sacola está vazia</h1>
          <p>
            Comece pelas coleções ou deixe o guia olfativo sugerir uma
            atmosfera para você.
          </p>
          <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/produtos" className="btn"><span>Ver a loja</span></Link>
            <Link href="/guia-olfativo" className="btn btn--ghost"><span>Guia olfativo</span></Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="conteudo" className="shell">
      <div className="page-hero">
        <p className="eyebrow">Sacola</p>
        <h1>Revise sua seleção.</h1>
      </div>

      <div className="checkout" style={{ paddingTop: "var(--s-6)" }}>
        <div>
          <ul>
            {resolved.map((item) => (
              <li className="bag-line" key={item.key} style={{ gridTemplateColumns: "6rem 1fr" }}>
                <div className="bag-line__media">
                  <Picture src={item.product.image} alt="" sizes={SIZES.thumb} />
                </div>
                <div>
                  <p className="bag-line__name">
                    <Link href={`/produtos/${item.product.slug}`}>{item.product.name}</Link>
                  </p>
                  <p className="bag-line__meta">
                    {item.size} · {item.product.family}
                  </p>
                  {!item.available && (
                    <p className="bag-line__meta" style={{ color: "var(--state-error)" }}>
                      Este tamanho ficou indisponível
                    </p>
                  )}
                  <label className="bag-line__meta" style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginTop: "0.4rem" }}>
                    <input
                      type="checkbox"
                      checked={item.gift}
                      onChange={(event) => setGift(item.key, event.target.checked)}
                    />
                    Embrulho para presente (+{money(GIFT_WRAP_PRICE)})
                  </label>
                  <div className="bag-line__foot">
                    <Stepper
                      value={item.quantity}
                      onChange={(next) => setQuantity(item.key, next)}
                      label={item.product.name}
                    />
                    <span className="bag-line__price">{money(item.lineTotal)}</span>
                    <button type="button" className="link" onClick={() => remove(item.key)}>
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: "var(--s-6)", maxWidth: "26rem" }}>
            <ShippingBox subtotal={subtotal} />
          </div>
        </div>

        <aside className="summary">
          <h2>Resumo</h2>
          <div className="totals">
            <div className="totals__row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="totals__row">
              <span>Frete</span>
              <span>{subtotal >= FREE_SHIPPING_FROM ? "cortesia" : "calculado no checkout"}</span>
            </div>
            <div className="totals__row totals__row--grand">
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </div>
          </div>
          <Link href="/checkout" className="btn btn--block"><span>Finalizar compra</span></Link>
          <Link href="/produtos" className="link link--static" style={{ textAlign: "center" }}>
            Continuar comprando
          </Link>
        </aside>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- checkout --- */

type Step = "identificacao" | "entrega" | "pagamento" | "revisao" | "confirmado";

const STEPS: { id: Step; label: string }[] = [
  { id: "identificacao", label: "Identificação" },
  { id: "entrega", label: "Entrega" },
  { id: "pagamento", label: "Pagamento" },
  { id: "revisao", label: "Revisão" },
];

const UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const PAYMENTS = [
  { id: "pix", label: "Pix", note: "Aprovação imediata" },
  { id: "cartao", label: "Cartão de crédito", note: "Em até 3× sem juros" },
  { id: "boleto", label: "Boleto bancário", note: "Compensa em até 2 dias úteis" },
] as const;

type Errors = Record<string, string>;

export function CheckoutPage() {
  const { resolved, subtotal, clear, announce } = useCart();

  const [step, setStep] = useState<Step>("identificacao");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<string | null>(null);

  const [id, setId] = useState({ nome: "", email: "", telefone: "" });
  const [addr, setAddr] = useState({
    cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  });
  const [payment, setPayment] = useState<string>("");
  const [consent, setConsent] = useState(false);

  const shipping = quoteShipping(addr.cep, subtotal);
  const freight = shipping.status === "ok" ? shipping.quote.price : 0;
  const total = subtotal + freight;

  if (resolved.length === 0 && step !== "confirmado") {
    return (
      <main id="conteudo" className="shell">
        <div className="empty-state" style={{ paddingBlock: "var(--s-10)" }}>
          <h1 style={{ fontSize: "var(--t-xl)" }}>Não há nada para finalizar</h1>
          <p>Sua sacola está vazia. Escolha uma fragrância antes de seguir.</p>
          <Link href="/produtos" className="btn"><span>Ver a loja</span></Link>
        </div>
      </main>
    );
  }

  function go(next: Step) {
    setStep(next);
    setErrors({});
    announce(`Etapa ${STEPS.findIndex((s) => s.id === next) + 1} de 4: ${STEPS.find((s) => s.id === next)?.label}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateId() {
    const next: Errors = {};
    if (id.nome.trim().length < 2) next.nome = "Informe seu nome completo.";
    if (!/^\S+@\S+\.\S+$/.test(id.email)) next.email = "Informe um e-mail válido.";
    setErrors(next);
    if (Object.keys(next).length === 0) go("entrega");
  }

  function validateAddr() {
    const next: Errors = {};
    if (!isValidCep(addr.cep)) next.cep = "CEP incompleto.";
    if (!addr.rua.trim()) next.rua = "Informe o endereço.";
    if (!addr.numero.trim()) next.numero = "Informe o número.";
    if (!addr.bairro.trim()) next.bairro = "Informe o bairro.";
    if (!addr.cidade.trim()) next.cidade = "Informe a cidade.";
    if (!addr.uf) next.uf = "Selecione o estado.";
    setErrors(next);
    if (Object.keys(next).length === 0) go("pagamento");
  }

  function validatePayment() {
    if (!payment) {
      setErrors({ payment: "Escolha uma forma de pagamento." });
      return;
    }
    go("revisao");
  }

  function confirm() {
    if (!consent) {
      setErrors({ consent: "É preciso aceitar os termos para concluir." });
      return;
    }
    setErrors({});
    setSubmitting(true);
    announce("Processando o pedido.");

    /* Estado de carregamento real, sem requisição: nada sai do navegador. */
    window.setTimeout(() => {
      setSubmitting(false);
      setOrder(`NC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      clear();
      setStep("confirmado");
      announce("Pedido confirmado. Nenhuma cobrança foi gerada.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1100);
  }

  if (step === "confirmado" && order) {
    return (
      <main id="conteudo" className="shell shell--tight">
        <div className="confirmation">
          <p className="eyebrow">Pedido registrado</p>
          <h1>Obrigado, {id.nome.split(" ")[0] || "visitante"}.</h1>
          <p className="confirmation__order">{order}</p>
          <p className="lede" style={{ textAlign: "center" }}>
            Enviamos o resumo para {id.email || "o e-mail informado"}.
          </p>
          <p className="confirmation__disclosure">
            Este site é um projeto autoral de portfólio da Varanda Estúdio Web.
            A compra é uma demonstração: nenhuma cobrança foi feita, nenhum
            pedido foi gerado e nenhum dado saiu deste navegador.
          </p>
          <Link href="/produtos" className="btn"><span>Voltar à loja</span></Link>
        </div>
      </main>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <main id="conteudo" className="shell">
      <nav className="crumbs" aria-label="Você está em">
        <Link href="/sacola">Sacola</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Checkout</span>
      </nav>

      <ol className="steps" aria-label="Progresso do checkout">
        {STEPS.map((entry, index) => (
          <li
            key={entry.id}
            data-state={index === currentIndex ? "current" : index < currentIndex ? "done" : "todo"}
            aria-current={index === currentIndex ? "step" : undefined}
          >
            {entry.label}
          </li>
        ))}
      </ol>

      <div className="checkout">
        <div className="checkout__panel">
          {step === "identificacao" && (
            <>
              <h1>Identificação</h1>
              <div className="form-grid">
                <div className="field field--full">
                  <label htmlFor="nome">Nome completo</label>
                  <input
                    id="nome"
                    autoComplete="name"
                    value={id.nome}
                    aria-invalid={Boolean(errors.nome)}
                    aria-describedby={errors.nome ? "erro-nome" : undefined}
                    onChange={(e) => setId((v) => ({ ...v, nome: e.target.value }))}
                  />
                  {errors.nome && <p className="field-error" id="erro-nome" role="alert">{errors.nome}</p>}
                </div>
                <div className="field">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={id.email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "erro-email" : undefined}
                    onChange={(e) => setId((v) => ({ ...v, email: e.target.value }))}
                  />
                  {errors.email && <p className="field-error" id="erro-email" role="alert">{errors.email}</p>}
                </div>
                <div className="field">
                  <label htmlFor="tel">Telefone (opcional)</label>
                  <input
                    id="tel"
                    type="tel"
                    autoComplete="tel"
                    value={id.telefone}
                    onChange={(e) => setId((v) => ({ ...v, telefone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="checkout__actions">
                <Link href="/sacola" className="btn btn--ghost"><span>Voltar à sacola</span></Link>
                <button type="button" className="btn" onClick={validateId}><span>Continuar</span></button>
              </div>
            </>
          )}

          {step === "entrega" && (
            <>
              <h1>Entrega</h1>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="cep">CEP</label>
                  <input
                    id="cep"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={addr.cep}
                    aria-invalid={Boolean(errors.cep)}
                    aria-describedby={errors.cep ? "erro-cep" : undefined}
                    onChange={(e) => setAddr((v) => ({ ...v, cep: formatCep(e.target.value) }))}
                  />
                  {errors.cep && <p className="field-error" id="erro-cep" role="alert">{errors.cep}</p>}
                </div>
                <div className="field">
                  <label htmlFor="numero">Número</label>
                  <input
                    id="numero"
                    value={addr.numero}
                    aria-invalid={Boolean(errors.numero)}
                    onChange={(e) => setAddr((v) => ({ ...v, numero: e.target.value }))}
                  />
                  {errors.numero && <p className="field-error" role="alert">{errors.numero}</p>}
                </div>
                <div className="field field--full">
                  <label htmlFor="rua">Endereço</label>
                  <input
                    id="rua"
                    autoComplete="street-address"
                    value={addr.rua}
                    aria-invalid={Boolean(errors.rua)}
                    onChange={(e) => setAddr((v) => ({ ...v, rua: e.target.value }))}
                  />
                  {errors.rua && <p className="field-error" role="alert">{errors.rua}</p>}
                </div>
                <div className="field">
                  <label htmlFor="complemento">Complemento (opcional)</label>
                  <input
                    id="complemento"
                    value={addr.complemento}
                    onChange={(e) => setAddr((v) => ({ ...v, complemento: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="bairro">Bairro</label>
                  <input
                    id="bairro"
                    value={addr.bairro}
                    aria-invalid={Boolean(errors.bairro)}
                    onChange={(e) => setAddr((v) => ({ ...v, bairro: e.target.value }))}
                  />
                  {errors.bairro && <p className="field-error" role="alert">{errors.bairro}</p>}
                </div>
                <div className="field">
                  <label htmlFor="cidade">Cidade</label>
                  <input
                    id="cidade"
                    value={addr.cidade}
                    aria-invalid={Boolean(errors.cidade)}
                    onChange={(e) => setAddr((v) => ({ ...v, cidade: e.target.value }))}
                  />
                  {errors.cidade && <p className="field-error" role="alert">{errors.cidade}</p>}
                </div>
                <div className="field">
                  <label htmlFor="uf">Estado</label>
                  <select
                    id="uf"
                    value={addr.uf}
                    aria-invalid={Boolean(errors.uf)}
                    onChange={(e) => setAddr((v) => ({ ...v, uf: e.target.value }))}
                  >
                    <option value="">Selecione</option>
                    {UF.map((sigla) => <option key={sigla} value={sigla}>{sigla}</option>)}
                  </select>
                  {errors.uf && <p className="field-error" role="alert">{errors.uf}</p>}
                </div>
              </div>

              {shipping.status === "ok" && (
                <p className="shipping__result" role="status">
                  {shipping.quote.free
                    ? <><strong>Frete cortesia</strong> para {shipping.quote.region}</>
                    : <><strong>{money(shipping.quote.price)}</strong> para {shipping.quote.region}</>}
                  {" "}· {shipping.quote.minDays} a {shipping.quote.maxDays} dias úteis.
                </p>
              )}

              <div className="checkout__actions">
                <button type="button" className="btn btn--ghost" onClick={() => go("identificacao")}><span>Voltar</span></button>
                <button type="button" className="btn" onClick={validateAddr}><span>Continuar</span></button>
              </div>
            </>
          )}

          {step === "pagamento" && (
            <>
              <h1>Pagamento</h1>
              <p className="field-hint">
                Escolha a forma preferida. Nenhum dado financeiro é solicitado
                nesta demonstração — não há campo de cartão, CVV ou documento.
              </p>
              <fieldset className="pay-options">
                <legend className="visually-hidden">Forma de pagamento</legend>
                {PAYMENTS.map((option) => (
                  <label className="pay-option" key={option.id}>
                    <input
                      type="radio"
                      name="pagamento"
                      value={option.id}
                      checked={payment === option.id}
                      onChange={() => setPayment(option.id)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <span>{option.note}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {errors.payment && <p className="field-error" role="alert">{errors.payment}</p>}
              <div className="checkout__actions">
                <button type="button" className="btn btn--ghost" onClick={() => go("entrega")}><span>Voltar</span></button>
                <button type="button" className="btn" onClick={validatePayment}><span>Continuar</span></button>
              </div>
            </>
          )}

          {step === "revisao" && (
            <>
              <h1>Revisão</h1>

              <div>
                <h2 className="eyebrow">Entrega</h2>
                <p style={{ marginTop: "var(--s-2)", color: "var(--ink-soft)" }}>
                  {id.nome} — {addr.rua}, {addr.numero}
                  {addr.complemento ? `, ${addr.complemento}` : ""} · {addr.bairro},{" "}
                  {addr.cidade}/{addr.uf} · {addr.cep}
                </p>
              </div>

              <div>
                <h2 className="eyebrow">Pagamento</h2>
                <p style={{ marginTop: "var(--s-2)", color: "var(--ink-soft)" }}>
                  {PAYMENTS.find((p) => p.id === payment)?.label}
                </p>
              </div>

              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  aria-invalid={Boolean(errors.consent)}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  Li e concordo com os <Link href="/termos">termos de uso</Link> e a{" "}
                  <Link href="/privacidade">política de privacidade</Link>.
                </span>
              </label>
              {errors.consent && <p className="field-error" role="alert">{errors.consent}</p>}

              <div className="checkout__actions">
                <button type="button" className="btn btn--ghost" onClick={() => go("pagamento")} disabled={submitting}>
                  <span>Voltar</span>
                </button>
                <button type="button" className="btn" onClick={confirm} disabled={submitting}>
                  <span>{submitting ? "Processando…" : "Concluir pedido"}</span>
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="summary">
          <h2>Seu pedido</h2>
          <div className="summary__items">
            {resolved.map((item) => (
              <div className="summary__item" key={item.key}>
                <span>
                  {item.quantity}× {item.product.name}
                  <br />
                  <span style={{ color: "var(--ink-faint)", fontSize: "var(--t-xs)" }}>
                    {item.size}{item.gift ? " · embrulho" : ""}
                  </span>
                </span>
                <span>{money(item.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="totals">
            <div className="totals__row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="totals__row">
              <span>Frete</span>
              <span>{shipping.status === "ok" ? (freight === 0 ? "cortesia" : money(freight)) : "a calcular"}</span>
            </div>
            <div className="totals__row totals__row--grand">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
