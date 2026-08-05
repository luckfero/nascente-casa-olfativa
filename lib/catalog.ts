export type CollectionSlug = "chuva-clara" | "folha-quente" | "sol-de-dentro";

export type Collection = {
  slug: CollectionSlug;
  name: string;
  family: string;
  description: string;
  notes: string[];
  image: string;
  heroImage: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  collection: CollectionSlug;
  category: "Perfumaria" | "Corpo" | "Casa" | "Presentes";
  price: number;
  description: string;
  sizes: { label: string; price: number; available: boolean }[];
  notes: string[];
  family: string;
  intensity: number;
  occasion: string[];
  use: string;
  care: string;
  image: string;
  featured?: boolean;
};

export const collections: Collection[] = [
  {
    slug: "chuva-clara",
    name: "Chuva Clara",
    family: "Mineral cítrica",
    description:
      "O instante em que a chuva encontra o concreto quente. Brilhante, úmida e silenciosamente amadeirada.",
    notes: ["Bergamota", "Folhas úmidas", "Cedro"],
    image: "/images/hq/colecao-chuva-clara.webp",
    heroImage: "/images/hq/colecao-chuva-clara.webp",
  },
  {
    slug: "folha-quente",
    name: "Folha Quente",
    family: "Verde amadeirada",
    description:
      "A sombra fresca no meio da tarde, atravessada pelo calor. Chá escuro, verde profundo e madeira macia.",
    notes: ["Chá preto", "Folha de figo", "Sândalo"],
    image: "/images/hq/colecao-folha-quente.webp",
    heroImage: "/images/hq/colecao-folha-quente.webp",
  },
  {
    slug: "sol-de-dentro",
    name: "Sol de Dentro",
    family: "Cítrica ambarada",
    description:
      "Luz que permanece na pele e na casa. Tangerina luminosa, flor branca e um fundo de âmbar sereno.",
    notes: ["Tangerina", "Flor de laranjeira", "Âmbar"],
    image: "/images/hq/colecao-sol-de-dentro.webp",
    heroImage: "/images/hq/colecao-sol-de-dentro.webp",
  },
];

export const products: Product[] = [
  {
    id: "colonia-chuva",
    slug: "colonia-chuva-clara",
    name: "Colônia Chuva Clara",
    collection: "chuva-clara",
    category: "Perfumaria",
    price: 129,
    description: "Frescor mineral com bergamota, folhas úmidas e cedro.",
    sizes: [
      { label: "10 ml", price: 39, available: true },
      { label: "50 ml", price: 129, available: true },
    ],
    notes: ["Bergamota", "Folhas úmidas", "Cedro"],
    family: "Mineral cítrica",
    intensity: 3,
    occasion: ["Manhã", "Trabalho", "Dias quentes"],
    use: "Borrife nos pulsos, no colo e atrás das orelhas, sem esfregar.",
    care: "Uso externo. Evite contato com os olhos e conserve ao abrigo da luz.",
    image: "/images/hq/colonia-chuva-clara.webp",
    featured: true,
  },
  {
    id: "vela-folha",
    slug: "vela-folha-quente",
    name: "Vela Folha Quente",
    collection: "folha-quente",
    category: "Casa",
    price: 58,
    description: "Chá preto e sândalo para desacelerar a casa.",
    sizes: [
      { label: "90 g", price: 58, available: true },
      { label: "180 g", price: 88, available: true },
    ],
    notes: ["Chá preto", "Folha de figo", "Sândalo"],
    family: "Verde amadeirada",
    intensity: 4,
    occasion: ["Fim de tarde", "Leitura", "Sala"],
    use: "Na primeira queima, deixe a cera derreter por toda a superfície.",
    care: "Nunca deixe a vela acesa sem supervisão.",
    image: "/images/hq/vela-folha-quente.webp",
    featured: true,
  },
  {
    id: "kit-descoberta",
    slug: "kit-descoberta",
    name: "Kit Descoberta",
    collection: "sol-de-dentro",
    category: "Presentes",
    price: 99,
    description: "As três colônias em versões de 10 ml.",
    sizes: [{ label: "3 × 10 ml", price: 99, available: true }],
    notes: ["Chuva Clara", "Folha Quente", "Sol de Dentro"],
    family: "Três famílias",
    intensity: 3,
    occasion: ["Descoberta", "Viagem", "Presente"],
    use: "Experimente uma fragrância por dia e observe sua evolução.",
    care: "Guarde os frascos na caixa, longe da luz e do calor.",
    image: "/images/hq/kit-descoberta.webp",
    featured: true,
  },
  {
    id: "colonia-folha",
    slug: "colonia-folha-quente",
    name: "Colônia Folha Quente",
    collection: "folha-quente",
    category: "Perfumaria",
    price: 129,
    description: "Verde profundo com chá preto e sândalo macio.",
    sizes: [
      { label: "10 ml", price: 39, available: true },
      { label: "50 ml", price: 129, available: true },
    ],
    notes: ["Chá preto", "Folha de figo", "Sândalo"],
    family: "Verde amadeirada",
    intensity: 4,
    occasion: ["Fim de tarde", "Dias amenos", "Encontros"],
    use: "Borrife nos pontos de pulsação e reaplique quando desejar.",
    care: "Uso externo. Mantenha longe de fontes de calor.",
    image: "/images/hq/colonia-folha-quente.webp",
  },
  {
    id: "colonia-sol",
    slug: "colonia-sol-de-dentro",
    name: "Colônia Sol de Dentro",
    collection: "sol-de-dentro",
    category: "Perfumaria",
    price: 129,
    description: "Tangerina luminosa, flor de laranjeira e âmbar.",
    sizes: [
      { label: "10 ml", price: 39, available: true },
      { label: "50 ml", price: 129, available: true },
    ],
    notes: ["Tangerina", "Flor de laranjeira", "Âmbar"],
    family: "Cítrica ambarada",
    intensity: 4,
    occasion: ["Encontros", "Noite", "Dias luminosos"],
    use: "Aplique nos pontos de pulsação, mantendo distância da pele.",
    care: "Uso externo. Não aplique sobre pele sensibilizada.",
    image: "/images/hq/colonia-sol-de-dentro.webp",
  },
  {
    id: "sabonete-chuva",
    slug: "sabonete-liquido-chuva-clara",
    name: "Sabonete líquido Chuva Clara",
    collection: "chuva-clara",
    category: "Corpo",
    price: 48,
    description: "Limpeza perfumada com atmosfera mineral.",
    sizes: [{ label: "250 ml", price: 48, available: true }],
    notes: ["Bergamota", "Folhas úmidas", "Cedro"],
    family: "Mineral cítrica",
    intensity: 2,
    occasion: ["Banho", "Lavabo", "Manhã"],
    use: "Aplique sobre a pele úmida, massageie e enxágue.",
    care: "Uso externo. Suspenda o uso em caso de irritação.",
    image: "/images/hq/sabonete-chuva-clara.webp",
  },
  {
    id: "hidratante-folha",
    slug: "hidratante-folha-quente",
    name: "Hidratante Folha Quente",
    collection: "folha-quente",
    category: "Corpo",
    price: 62,
    description: "Textura confortável com chá preto e sândalo.",
    sizes: [{ label: "200 ml", price: 62, available: true }],
    notes: ["Chá preto", "Folha de figo", "Sândalo"],
    family: "Verde amadeirada",
    intensity: 3,
    occasion: ["Pós-banho", "Noite", "Dias amenos"],
    use: "Massageie sobre a pele limpa até completa absorção.",
    care: "Uso externo. Evite áreas sensibilizadas.",
    image: "/images/hq/hidratante-folha-quente.webp",
  },
  {
    id: "oleo-sol",
    slug: "oleo-de-banho-sol-de-dentro",
    name: "Óleo de banho Sol de Dentro",
    collection: "sol-de-dentro",
    category: "Corpo",
    price: 72,
    description: "Toque luminoso de tangerina e âmbar.",
    sizes: [{ label: "120 ml", price: 72, available: true }],
    notes: ["Tangerina", "Flor de laranjeira", "Âmbar"],
    family: "Cítrica ambarada",
    intensity: 3,
    occasion: ["Banho", "Noite", "Ritual de cuidado"],
    use: "Aplique uma pequena quantidade sobre a pele úmida e enxágue.",
    care: "O produto pode tornar o piso escorregadio. Uso externo.",
    image: "/images/hq/oleo-sol-de-dentro.webp",
  },
  {
    id: "difusor-chuva",
    slug: "difusor-chuva-clara",
    name: "Difusor Chuva Clara",
    collection: "chuva-clara",
    category: "Casa",
    price: 92,
    description: "Frescor mineral contínuo para o ambiente.",
    sizes: [{ label: "200 ml", price: 92, available: true }],
    notes: ["Bergamota", "Folhas úmidas", "Cedro"],
    family: "Mineral cítrica",
    intensity: 3,
    occasion: ["Entrada", "Quarto", "Rotina"],
    use: "Insira as varetas e vire-as periodicamente.",
    care: "Mantenha fora do alcance de crianças e animais.",
    image: "/images/hq/difusor-chuva-clara.webp",
  },
  {
    id: "spray-sol",
    slug: "spray-de-ambiente-sol-de-dentro",
    name: "Spray Sol de Dentro",
    collection: "sol-de-dentro",
    category: "Casa",
    price: 64,
    description: "Uma névoa solar para mudar a atmosfera.",
    sizes: [{ label: "100 ml", price: 64, available: true }],
    notes: ["Tangerina", "Flor de laranjeira", "Âmbar"],
    family: "Cítrica ambarada",
    intensity: 4,
    occasion: ["Sala", "Receber", "Fim de tarde"],
    use: "Borrife no ambiente, distante de superfícies delicadas.",
    care: "Não aplique diretamente sobre a pele, móveis ou animais.",
    image: "/images/hq/spray-sol-de-dentro.webp",
  },
  {
    id: "ritual-corpo",
    slug: "ritual-do-corpo",
    name: "Ritual do Corpo",
    collection: "folha-quente",
    category: "Presentes",
    price: 164,
    description: "Sabonete, hidratante e óleo na mesma atmosfera.",
    sizes: [{ label: "3 produtos", price: 164, available: true }],
    notes: ["Três texturas", "Coleção à escolha", "Embalagem especial"],
    family: "Coleção à escolha",
    intensity: 3,
    occasion: ["Aniversário", "Autocuidado", "Agradecimento"],
    use: "Use os produtos em sequência para construir camadas.",
    care: "Confira os cuidados indicados em cada produto.",
    image: "/images/hq/ritual-do-corpo.webp",
  },
  {
    id: "casa-nascente",
    slug: "casa-nascente",
    name: "Casa Nascente",
    collection: "folha-quente",
    category: "Presentes",
    price: 138,
    description: "Vela de 180 g e spray para transformar a casa.",
    sizes: [{ label: "2 produtos", price: 138, available: true }],
    notes: ["Vela 180 g", "Spray 100 ml", "Coleção à escolha"],
    family: "Coleção à escolha",
    intensity: 4,
    occasion: ["Casa nova", "Agradecimento", "Receber"],
    use: "Use os produtos juntos ou em momentos diferentes.",
    care: "Siga os cuidados de segurança da vela e do spray.",
    image: "/images/hq/casa-nascente.webp",
  },
  {
    id: "presente-completo",
    slug: "presente-completo",
    name: "Presente Completo",
    collection: "sol-de-dentro",
    category: "Presentes",
    price: 199,
    description: "Colônia, hidratante e apresentação especial.",
    sizes: [{ label: "Conjunto", price: 199, available: true }],
    notes: ["Colônia 50 ml", "Hidratante 200 ml", "Embalagem"],
    family: "Coleção à escolha",
    intensity: 4,
    occasion: ["Celebração", "Presente marcante", "Datas especiais"],
    use: "Escolha a coleção e escreva uma mensagem para acompanhar.",
    care: "Confira os cuidados de cada produto incluído.",
    image: "/images/hq/presente-completo.webp",
    featured: true,
  },
];

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const productBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);

export const collectionBySlug = (slug: string) =>
  collections.find((collection) => collection.slug === slug);
