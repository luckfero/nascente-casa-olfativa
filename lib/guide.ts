import type { CollectionSlug } from "./catalog";

/**
 * Guia olfativo — questionário por eixos.
 *
 * O visitante nunca precisa saber o que é "família amadeirada". Cada pergunta
 * mede uma dimensão diferente da escolha (momento, temperatura, presença,
 * destino, gesto) e cada resposta distribui pontos entre as três coleções.
 * A recomendação sai da soma — não de uma única resposta —, o que faz o
 * resultado parecer conquistado em vez de sorteado.
 */

export type Scores = Record<CollectionSlug, number>;

export interface GuideOption {
  id: string;
  label: string;
  hint: string;
  scores: Partial<Scores>;
}

export interface GuideQuestion {
  id: string;
  eyebrow: string;
  prompt: string;
  help: string;
  options: GuideOption[];
}

export const questions: GuideQuestion[] = [
  {
    id: "momento",
    eyebrow: "Primeiro eixo",
    prompt: "Em que momento do dia você quer ser lembrado?",
    help: "A hora em que a fragrância aparece muda tudo — luz, temperatura e ritmo são diferentes.",
    options: [
      {
        id: "manha",
        label: "Manhã cedo",
        hint: "Ar ainda frio, dia por começar",
        scores: { "chuva-clara": 3, "sol-de-dentro": 1 },
      },
      {
        id: "tarde",
        label: "Meio da tarde",
        hint: "Calor assentado, sombra procurada",
        scores: { "folha-quente": 3, "sol-de-dentro": 1 },
      },
      {
        id: "fim-de-tarde",
        label: "Fim da tarde",
        hint: "Luz baixa entrando de lado",
        scores: { "sol-de-dentro": 3, "folha-quente": 1 },
      },
      {
        id: "noite",
        label: "Noite",
        hint: "Casa fechada, jantar posto",
        scores: { "folha-quente": 2, "sol-de-dentro": 2 },
      },
    ],
  },
  {
    id: "temperatura",
    eyebrow: "Segundo eixo",
    prompt: "Você prefere sensação fria ou quente?",
    help: "Não é sobre o clima lá fora, mas sobre a temperatura que o aroma deixa na pele.",
    options: [
      {
        id: "fria",
        label: "Fria e mineral",
        hint: "Pedra molhada, ar limpo",
        scores: { "chuva-clara": 4 },
      },
      {
        id: "morna",
        label: "Morna e seca",
        hint: "Madeira ao sol, folha aquecida",
        scores: { "folha-quente": 4 },
      },
      {
        id: "quente",
        label: "Quente e envolvente",
        hint: "Âmbar, resina, luz dourada",
        scores: { "sol-de-dentro": 4 },
      },
    ],
  },
  {
    id: "presenca",
    eyebrow: "Terceiro eixo",
    prompt: "Quanto você quer que ela ocupe o ambiente?",
    help: "Projeção é o quanto a fragrância se anuncia antes de você.",
    options: [
      {
        id: "discreta",
        label: "Perto da pele",
        hint: "Só quem chega perto percebe",
        scores: { "chuva-clara": 3, "folha-quente": 1 },
      },
      {
        id: "media",
        label: "Presente, sem dominar",
        hint: "Acompanha, não anuncia",
        scores: { "folha-quente": 3, "chuva-clara": 1 },
      },
      {
        id: "marcante",
        label: "Que entra antes de mim",
        hint: "Deixa rastro no ambiente",
        scores: { "sol-de-dentro": 4 },
      },
    ],
  },
  {
    id: "destino",
    eyebrow: "Quarto eixo",
    prompt: "Onde essa atmosfera vai viver?",
    help: "A mesma fragrância existe em colônia, cuidado para o corpo e perfumação de casa.",
    options: [
      {
        id: "pele",
        label: "Na minha pele",
        hint: "Colônia e cuidados para o corpo",
        scores: { "sol-de-dentro": 2, "chuva-clara": 1 },
      },
      {
        id: "casa",
        label: "Na minha casa",
        hint: "Vela, difusor e spray de ambiente",
        scores: { "folha-quente": 2, "chuva-clara": 1 },
      },
      {
        id: "ambos",
        label: "Nos dois",
        hint: "Uma assinatura só, do banho à sala",
        scores: { "chuva-clara": 1, "folha-quente": 1, "sol-de-dentro": 1 },
      },
      {
        id: "presente",
        label: "É para presentear",
        hint: "Alguém específico em mente",
        scores: { "sol-de-dentro": 2, "folha-quente": 1 },
      },
    ],
  },
  {
    id: "memoria",
    eyebrow: "Último eixo",
    prompt: "Qual dessas lembranças te agrada mais?",
    help: "A escolha final costuma ser afetiva, não técnica.",
    options: [
      {
        id: "chuva",
        label: "O cheiro da chuva chegando",
        hint: "Terra quente recebendo água",
        scores: { "chuva-clara": 4 },
      },
      {
        id: "cha",
        label: "Chá preto sendo servido",
        hint: "Folha seca, vapor, madeira",
        scores: { "folha-quente": 4 },
      },
      {
        id: "sol",
        label: "Casca de tangerina no sol",
        hint: "Cítrico maduro e doce",
        scores: { "sol-de-dentro": 4 },
      },
      {
        id: "sombra",
        label: "Sombra de árvore em dia quente",
        hint: "Verde denso, ar parado",
        scores: { "folha-quente": 3, "chuva-clara": 2 },
      },
    ],
  },
];

export const EMPTY_SCORES: Scores = {
  "chuva-clara": 0,
  "folha-quente": 0,
  "sol-de-dentro": 0,
};

export interface GuideResult {
  winner: CollectionSlug;
  runnerUp: CollectionSlug;
  /** Percentual de afinidade por coleção, somando 100. */
  affinity: { slug: CollectionSlug; percent: number }[];
  /** Quão destacada ficou a primeira colocada, de 0 a 1. */
  confidence: number;
}

export function tallyAnswers(answers: Record<string, string>): GuideResult {
  const scores: Scores = { ...EMPTY_SCORES };

  for (const question of questions) {
    const choiceId = answers[question.id];
    if (!choiceId) continue;
    const option = question.options.find((entry) => entry.id === choiceId);
    if (!option) continue;
    for (const [slug, points] of Object.entries(option.scores)) {
      scores[slug as CollectionSlug] += points ?? 0;
    }
  }

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1;

  const ranked = (Object.entries(scores) as [CollectionSlug, number][])
    .map(([slug, value]) => ({ slug, value }))
    .sort((a, b) => b.value - a.value);

  /* Arredondar cada fatia isoladamente pode somar 99 ou 101. A última recebe
     o resto para o total fechar exatamente em 100. */
  const affinity = ranked.map((entry, index) => ({
    slug: entry.slug,
    percent:
      index === ranked.length - 1
        ? 100 - ranked.slice(0, -1).reduce((sum, other) => sum + Math.round((other.value / total) * 100), 0)
        : Math.round((entry.value / total) * 100),
  }));

  return {
    winner: ranked[0].slug,
    runnerUp: ranked[1].slug,
    affinity,
    confidence: Math.min(1, (ranked[0].value - ranked[1].value) / Math.max(1, ranked[0].value)),
  };
}

/** Papel de cada nota na pirâmide, na ordem em que aparecem no catálogo. */
export const NOTE_ROLES = ["Saída", "Corpo", "Fundo"] as const;
