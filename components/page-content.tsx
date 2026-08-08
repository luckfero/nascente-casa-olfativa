"use client";

import Link from "next/link";
import { useState } from "react";
import { SIZES } from "@/lib/images";
import { Picture, Reveal } from "./ui";

/* ------------------------------------------------------------- a casa ----- */

/** Ícone de cada marco. Traço fino, mesma linguagem do resto da interface. */
const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  casa: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.2 12 5l8 6.2V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7.8Z" />
      <path d="M10 20v-5h4v5" />
    </svg>
  ),
  pele: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 3h4v2.5l1.6 1.8A3 3 0 0 1 16.4 9v9a2 2 0 0 1-2 2H9.6a2 2 0 0 1-2-2V9a3 3 0 0 1 .8-1.7L10 5.5V3Z" />
      <path d="M8 12h8" />
    </svg>
  ),
  vocabulario: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="12" r="4.2" />
      <circle cx="15" cy="12" r="4.2" />
      <path d="M12 4v16" />
    </svg>
  ),
};

const TIMELINE = [
  {
    id: "casa",
    year: "2021",
    title: "Primeiro, a casa.",
    text: "A Nascente começa em São Paulo com velas, difusores e sprays de ambiente organizados por atmosferas completas.",
  },
  {
    id: "pele",
    year: "2024",
    title: "Depois, a pele.",
    text: "As coleções ganham colônias, sabonetes, hidratantes e óleos. O perfume passa a acompanhar os rituais do dia.",
  },
  {
    id: "vocabulario",
    year: "Hoje",
    title: "Um vocabulário só.",
    text: "Corpo, casa e presentes compartilham as mesmas três coleções, facilitando combinações sem excesso de opções.",
  },
];

export function AboutPage() {
  return (
    <main id="conteudo">
      <section className="hero hero--statement">
        <div className="hero__media">
          <Picture
            src="/images/hq/hero-terra-editorial.webp"
            alt="Composição editorial da Nascente com frascos âmbar e matérias-primas"
            sizes={SIZES.full}
            priority
          />
        </div>
        <div className="hero__copy">
          <p className="eyebrow">A casa</p>
          <h1 className="hero__title">
            Perfume é memória <em>construída.</em>
          </h1>
        </div>
      </section>

      <section className="manifesto">
        <div className="shell">
          <header className="manifesto__head">
            <p className="eyebrow eyebrow--page">Como nascemos</p>
            <h2>Entre a casa e a pele, existe atmosfera.</h2>
          </header>

          <figure className="manifesto__media">
            <Picture
              src="/images/hq/editorial-materias.webp"
              alt="Bergamota, chá preto, resinas e madeiras sobre superfície de pedra"
              sizes={SIZES.full}
            />
          </figure>

          <div className="manifesto__text">
            <p>
              A Nascente começou em 2021, num apartamento de esquina na Vila
              Madalena, a partir de uma percepção incômoda: a maior barreira
              para comprar perfume nunca foi quanto ele custa — é não fazer
              ideia do que se está levando para casa.
            </p>
            <p>
              Marina Azevedo trabalhava havia sete anos com desenvolvimento de
              produto quando percebeu que passava mais tempo explicando
              fragrâncias a amigos do que vendendo qualquer coisa. As perguntas
              eram sempre as mesmas: isso é forte? dura quanto tempo? serve
              para o dia? Nenhum rótulo respondia.
            </p>
            <p>
              A primeira coleção nasceu dessa lacuna. Em vez de organizar o
              catálogo por concentração ou família técnica, partimos de três
              momentos que qualquer pessoa reconhece sem esforço: o frescor que
              fica depois da chuva, o calor seco das folhas ao sol da tarde e a
              luz que atravessa a casa no fim da manhã.
            </p>
            <p>
              Chuva Clara, Folha Quente e Sol de Dentro levaram catorze meses
              para sair do papel. Foram trinta e uma versões descartadas até as
              três primeiras aprovadas — a maioria caiu por durar pouco na pele
              ou por mudar de caráter depois da primeira hora.
            </p>
            <p>
              Em 2024 veio a decisão que definiu a casa: em vez de lançar
              coleções novas a cada estação, levamos as mesmas três para
              sabonete, hidratante, óleo, vela e difusor. A lógica é simples —
              quem gosta de um aroma não quer trocá-lo, quer encontrá-lo em
              mais lugares.
            </p>
            <p>
              Produzimos em lotes pequenos, com o mesmo fornecedor de vidro
              âmbar desde o começo. Cada frasco sai com a data do lote no
              fundo. Não é sofisticação: é o jeito mais honesto de dizer que
              existe alguém do outro lado, respondendo por aquilo.
            </p>
          </div>
        </div>
      </section>

      <section className="timeline-band">
        <div className="shell">
          <div className="section-head" style={{ borderBottom: 0, justifyContent: "center", textAlign: "center" }}>
            <div>
              <p className="eyebrow">Linha do tempo</p>
              <h2>O caminho até aqui.</h2>
            </div>
          </div>

          <ol className="timeline">
            {TIMELINE.map((entry, index) => (
              <Reveal as="li" key={entry.id} delay={index * 120} className="timeline__node">
                <span className="timeline__marker" aria-hidden="true">
                  {MILESTONE_ICONS[entry.id]}
                </span>
                <span className="timeline__year">{entry.year}</span>
                <h3 className="timeline__title">{entry.title}</h3>
                <p className="timeline__text">{entry.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------- ajuda ------ */

const FAQ = [
  {
    q: "Como escolher uma fragrância sem sentir antes?",
    a: "Cada produto traz a pirâmide olfativa completa, a escala de intensidade e as ocasiões de uso recomendadas. Se preferir começar pela sensação, o Guia Olfativo indica a coleção mais próxima do que você procura.",
  },
  {
    q: "Os produtos de uma mesma coleção têm exatamente o mesmo cheiro?",
    a: "Sim. Colônia, sabonete, hidratante, óleo, vela, difusor e spray de uma coleção partem da mesma composição. O que muda é a concentração e a forma de aplicação — por isso a intensidade varia entre eles.",
  },
  {
    q: "Como funciona a escala de intensidade?",
    a: "Vai de 1 (muito suave) a 5 (intensa) e indica a projeção do aroma. Produtos para o corpo costumam ficar entre 2 e 3; colônias e velas chegam a 4.",
  },
  {
    q: "Qual o prazo de entrega?",
    a: "O prazo aparece na sacola e no checkout depois que você informa o CEP. Ele varia conforme a região de destino.",
  },
  {
    q: "Existe frete cortesia?",
    a: "Sim, para pedidos acima de R$ 260, em todo o Brasil.",
  },
  {
    q: "Posso pedir embrulho para presente?",
    a: "Sim. A opção aparece na sacola, item a item, com acréscimo de R$ 12 por produto embrulhado.",
  },
  {
    q: "Como funcionam as trocas?",
    a: "Produtos lacrados podem ser trocados em até 7 dias corridos após o recebimento. Produtos abertos apenas em caso de defeito de fabricação.",
  },
];

export function HelpPage() {
  return (
    <main id="conteudo" className="shell shell--tight">
      <div className="page-hero">
        <p className="eyebrow">Atendimento</p>
        <h1>Perguntas frequentes</h1>
        <p className="lede">
          Se a sua dúvida não estiver aqui, fale com a casa pelo{" "}
          <Link href="/contato" style={{ textDecoration: "underline" }}>formulário de contato</Link>.
        </p>
      </div>

      <div className="section faq">
        {FAQ.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}

/* ---------------------------------------------------------- entregas ------ */

export function ShippingPage() {
  return (
    <main id="conteudo" className="shell shell--tight">
      <div className="page-hero">
        <p className="eyebrow">Atendimento</p>
        <h1>Entregas e trocas</h1>
      </div>

      <div className="section prose">
        <h2>Prazo e valor</h2>
        <p>
          O prazo e o valor são estimados a partir do CEP informado na sacola,
          antes de finalizar. Pedidos acima de R$ 260 têm frete cortesia para
          todo o Brasil.
        </p>

        <h2>Embrulho para presente</h2>
        <p>
          Disponível item a item, com acréscimo de R$ 12 por produto. A caixa
          segue sem informação de preço.
        </p>

        <h2>Trocas e devoluções</h2>
        <ul>
          <li>Produtos lacrados: troca em até 7 dias corridos após o recebimento.</li>
          <li>Produtos abertos: apenas em caso de defeito de fabricação.</li>
          <li>Kits e presentes: a troca é feita do conjunto completo, não de itens avulsos.</li>
          <li>O frete de devolução por arrependimento fica por conta do cliente.</li>
        </ul>

        <h2>Como solicitar</h2>
        <p>
          Escreva para <strong>atendimento@nascente.com.br</strong> informando
          o número do pedido e o motivo. A resposta sai em até 2 dias úteis.
        </p>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------ contato ----- */

export function ContactPage() {
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.nome.trim()) next.nome = "Informe seu nome.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Informe um e-mail válido.";
    if (form.mensagem.trim().length < 10) next.mensagem = "Escreva um pouco mais sobre o assunto.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 800);
  }

  return (
    <main id="conteudo" className="shell shell--tight">
      <div className="page-hero">
        <p className="eyebrow">Contato</p>
        <h1>Fale com a casa.</h1>
        <p className="lede">
          Atendimento por e-mail em <strong>atendimento@nascente.com.br</strong>,
          de segunda a sexta, com resposta em até 2 dias úteis.
        </p>
      </div>

      <div className="section">
        {sent ? (
          <div className="alert" role="status" style={{ borderLeftColor: "var(--state-success)", background: "var(--bg-muted)" }}>
            <strong>Mensagem registrada.</strong>
            Respondemos em até 2 dias úteis. Nesta demonstração, nada foi enviado a um servidor.
          </div>
        ) : (
          <form onSubmit={submit} noValidate style={{ display: "grid", gap: "var(--s-4)" }}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="c-nome">Nome</label>
                <input
                  id="c-nome"
                  autoComplete="name"
                  value={form.nome}
                  aria-invalid={Boolean(errors.nome)}
                  onChange={(e) => setForm((v) => ({ ...v, nome: e.target.value }))}
                />
                {errors.nome && <p className="field-error" role="alert">{errors.nome}</p>}
              </div>
              <div className="field">
                <label htmlFor="c-email">E-mail</label>
                <input
                  id="c-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  aria-invalid={Boolean(errors.email)}
                  onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
                />
                {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
              </div>
              <div className="field field--full">
                <label htmlFor="c-assunto">Assunto (opcional)</label>
                <input
                  id="c-assunto"
                  value={form.assunto}
                  onChange={(e) => setForm((v) => ({ ...v, assunto: e.target.value }))}
                />
              </div>
              <div className="field field--full">
                <label htmlFor="c-msg">Mensagem</label>
                <textarea
                  id="c-msg"
                  value={form.mensagem}
                  aria-invalid={Boolean(errors.mensagem)}
                  onChange={(e) => setForm((v) => ({ ...v, mensagem: e.target.value }))}
                />
                {errors.mensagem && <p className="field-error" role="alert">{errors.mensagem}</p>}
              </div>
            </div>
            <button type="submit" className="btn" disabled={sending} style={{ justifySelf: "start" }}>
              <span>{sending ? "Enviando…" : "Enviar mensagem"}</span>
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

/* ----------------------------------------------------------- políticas ---- */

export function PoliciesPage() {
  return (
    <main id="conteudo" className="shell">
      <div className="page-hero">
        <p className="eyebrow">Institucional</p>
        <h1>Privacidade e termos</h1>
      </div>

      <div className="section legal">
        <article className="legal__column">
          <h2 className="legal__title">Política de privacidade</h2>

          <h3>Quais dados são pedidos</h3>
          <p>
            Os formulários deste site podem solicitar nome, e-mail, telefone e
            endereço de entrega. Esses dados servem apenas para responder ao
            contato ou simular o fluxo de compra.
          </p>

          <h3>Para onde eles vão</h3>
          <p>
            Para lugar nenhum. Este é um projeto autoral de portfólio:{" "}
            <strong>nenhum dado preenchido é enviado a um servidor</strong>,
            processado por terceiros ou armazenado de forma permanente. As
            informações existem apenas na sessão do seu navegador.
          </p>

          <h3>Armazenamento local</h3>
          <p>
            Usamos apenas o <code>localStorage</code> do navegador para lembrar
            os itens da sacola entre visitas. Não há cookies de rastreamento,
            publicidade ou análise de audiência.
          </p>

          <h3>Seus direitos</h3>
          <p>
            Em uma operação real, você poderia solicitar acesso, correção ou
            exclusão dos seus dados a qualquer momento pelo canal de
            atendimento.
          </p>
        </article>

        <article className="legal__column">
          <h2 className="legal__title">Termos de uso</h2>

          <h3>Sobre este site</h3>
          <p>
            A marca Nascente, seus produtos, preços e operação são fictícios e
            existem como demonstração de trabalho da Varanda Estúdio Web.
            Nenhuma compra realizada aqui gera cobrança ou envio.
          </p>

          <h3>Descrições olfativas</h3>
          <p>
            As descrições sensoriais, notas e escalas de intensidade são
            percepções de referência e podem variar de pessoa para pessoa.
          </p>

          <h3>Preços e disponibilidade</h3>
          <p>
            Valores, tamanhos e disponibilidade exibidos fazem parte do
            conteúdo conceitual desta demonstração e não constituem oferta.
          </p>

          <h3>Conteúdo</h3>
          <p>
            Textos, identidade visual e imagens deste site pertencem à Varanda
            Estúdio Web e não devem ser reproduzidos como material de uma marca
            real.
          </p>
        </article>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------- 404 ------- */

export function NotFoundPage() {
  return (
    <main id="conteudo" className="shell">
      <div className="empty-state" style={{ paddingBlock: "var(--s-10)" }}>
        <p className="eyebrow">Erro 404</p>
        <h1 style={{ fontSize: "var(--t-2xl)" }}>Esta página não existe.</h1>
        <p>O endereço pode ter mudado de lugar — ou nunca ter existido.</p>
        <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn"><span>Voltar ao início</span></Link>
          <Link href="/produtos" className="btn btn--ghost"><span>Ver a loja</span></Link>
        </div>
      </div>
    </main>
  );
}
