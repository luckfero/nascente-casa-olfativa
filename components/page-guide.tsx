"use client";

import Link from "next/link";
import { useState } from "react";
import { collectionBySlug, products } from "@/lib/catalog";
import { questions, tallyAnswers } from "@/lib/guide";
import { SIZES } from "@/lib/images";
import { useCart } from "./cart";
import { Picture } from "./ui";
import { ProductCard } from "./product-card";

type Phase = "intro" | "quiz" | "result";

export function GuidePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { announce } = useCart();

  const question = questions[step];
  const answered = question ? answers[question.id] : undefined;
  const progress = Math.round((step / questions.length) * 100);

  function choose(optionId: string) {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));

    /* Pequena pausa antes de avançar: o visitante vê a própria escolha marcada
       em vez de a tela pular no mesmo instante do clique. */
    window.setTimeout(() => {
      if (step + 1 < questions.length) {
        setStep(step + 1);
        announce(`Pergunta ${step + 2} de ${questions.length}`);
      } else {
        setPhase("result");
        announce("Resultado do guia olfativo pronto.");
      }
    }, 260);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setPhase("intro");
  }

  /* ------------------------------------------------------------- intro --- */
  if (phase === "intro") {
    return (
      <main id="conteudo">
        <section className="quiz-intro">
          <div className="quiz-intro__media">
            <Picture
              src="/images/hq/editorial-materias.webp"
              alt="Bergamota, chá preto, resinas e madeiras dispostos como referências olfativas"
              sizes={SIZES.half}
              priority
            />
          </div>
          <div className="quiz-intro__body">
            <p className="eyebrow eyebrow--page">Guia olfativo</p>
            <h1>Cinco perguntas até a sua atmosfera.</h1>
            <p className="lede">
              Nenhuma delas exige vocabulário de perfumaria. Falamos de horário,
              temperatura, presença e memória — e a partir disso cruzamos as
              três coleções da casa.
            </p>
            <ol className="quiz-intro__steps">
              <li><span>01</span> Momento do dia</li>
              <li><span>02</span> Temperatura da sensação</li>
              <li><span>03</span> Presença no ambiente</li>
              <li><span>04</span> Onde vai viver</li>
              <li><span>05</span> Memória preferida</li>
            </ol>
            <button type="button" className="btn" onClick={() => setPhase("quiz")}>
              <span>Começar · leva 1 minuto</span>
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* -------------------------------------------------------------- quiz --- */
  if (phase === "quiz" && question) {
    return (
      <main id="conteudo" className="shell shell--tight">
        <div className="quiz">
          <div className="quiz__head">
            <div className="quiz__progress">
              <div className="quiz__bar">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="quiz__counter">
                Pergunta {step + 1} de {questions.length}
              </p>
            </div>
            <button type="button" className="link" onClick={restart}>
              Recomeçar
            </button>
          </div>

          <div className="quiz__question" key={question.id}>
            <p className="eyebrow">{question.eyebrow}</p>
            <h1>{question.prompt}</h1>
            <p className="quiz__help">{question.help}</p>

            <div className="quiz__options" role="radiogroup" aria-label={question.prompt}>
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={answered === option.id}
                  className="quiz-option"
                  onClick={() => choose(option.id)}
                >
                  <span className="quiz-option__label">{option.label}</span>
                  <span className="quiz-option__hint">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <button
              type="button"
              className="link quiz__back"
              onClick={() => setStep(step - 1)}
            >
              ← Pergunta anterior
            </button>
          )}
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------ result --- */
  const result = tallyAnswers(answers);
  const winner = collectionBySlug(result.winner);
  const runnerUp = collectionBySlug(result.runnerUp);
  if (!winner) return null;

  const suggested = products
    .filter((product) => product.collection === winner.slug)
    .slice(0, 4);

  const decisive = result.confidence >= 0.3;

  return (
    <main id="conteudo">
      <section className="quiz-result">
        <div className="quiz-result__media">
          <Picture
            src={winner.heroImage}
            alt={`Composição da coleção ${winner.name}`}
            sizes={SIZES.full}
            priority
          />
        </div>

        <div className="shell quiz-result__body">
          <p className="eyebrow">Sua atmosfera</p>
          <h1>{winner.name}</h1>
          <p className="quiz-result__family">{winner.family}</p>
          <p className="quiz-result__desc">{winner.description}</p>

          <ul className="quiz-result__notes">
            {winner.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>

          <div className="quiz-result__actions">
            <Link href={`/colecoes/${winner.slug}`} className="btn btn--on-dark">
              <span>Ver a coleção {winner.name}</span>
            </Link>
            <button type="button" className="btn btn--ghost btn--on-media" onClick={restart}>
              <span>Refazer o guia</span>
            </button>
          </div>
        </div>
      </section>

      <div className="shell section">
        <div className="affinity">
          <div>
            <p className="eyebrow">Como chegamos aqui</p>
            <h2>Suas respostas em números.</h2>
            <p className="affinity__note">
              {decisive
                ? `Suas escolhas apontaram com folga para ${winner.name}.`
                : `${winner.name} venceu por pouco — ${runnerUp?.name} também combina com o que você descreveu e vale conhecer.`}
            </p>
          </div>

          <ul className="affinity__list">
            {result.affinity.map((entry) => {
              const collection = collectionBySlug(entry.slug);
              if (!collection) return null;
              return (
                <li key={entry.slug}>
                  <div className="affinity__row">
                    <span>{collection.name}</span>
                    <span className="affinity__value">{entry.percent}%</span>
                  </div>
                  <div className="affinity__track">
                    <span
                      style={{ width: `${entry.percent}%` }}
                      data-winner={entry.slug === winner.slug}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="shell section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Para começar</p>
            <h2>Quatro portas de entrada.</h2>
          </div>
          <Link href={`/colecoes/${winner.slug}`} className="link">
            Ver tudo de {winner.name}
          </Link>
        </div>
        <div className="grid-products grid-products--4">
          {suggested.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
