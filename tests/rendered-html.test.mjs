import assert from "node:assert/strict";
import test from "node:test";

/* Cada import do worker precisa de uma query única: sem ela o Node devolve
   o módulo do cache e o estado de um teste vaza para o seguinte. */
async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

async function fetchRoute(path) {
  const worker = await loadWorker();
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

const CABECALHOS_ESPERADOS = {
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), geolocation=(), microphone=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

/* Cobre os três tipos de resposta: página normal, 404 e recurso que não é
   HTML. O 404 é o caso fácil de esquecer — ele é remontado no worker, e uma
   `new Response` nasce sem os cabeçalhos do original. */
for (const [rotulo, rota] of [
  ["a home", "/"],
  ["uma rota interna", "/produtos"],
  ["a página 404", "/pagina-que-nao-existe"],
  ["o robots.txt", "/robots.txt"],
]) {
  test(`${rotulo} responde com os cabeçalhos de segurança`, async () => {
    const response = await fetchRoute(rota);
    for (const [nome, valor] of Object.entries(CABECALHOS_ESPERADOS)) {
      assert.equal(response.headers.get(nome), valor, `${nome} em ${rota}`);
    }
  });
}

test("renderiza a página inicial da Nascente", async () => {
  const response = await fetchRoute("/");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(html, /Nascente/);
});

/* A lista precisa espelhar `lib/routes.ts`. Se uma rota for adicionada lá e
   esquecida no storefront — ou o contrário — um destes casos quebra. */
const ROTAS_REAIS = [
  "/produtos",
  "/colecoes",
  "/guia-olfativo",
  "/sobre",
  "/ajuda",
  "/entregas-e-trocas",
  "/contato",
  "/sacola",
  "/checkout",
  "/politicas",
  "/privacidade",
  "/termos",
];

for (const rota of ROTAS_REAIS) {
  test(`${rota} responde 200`, async () => {
    const response = await fetchRoute(rota);
    assert.equal(response.status, 200);
  });
}

/* O outro lado da moeda: a validação por slug não pode derrubar página real. */
const ROTAS_DE_DETALHE = [
  "/colecoes/chuva-clara",
  "/colecoes/folha-quente",
  "/colecoes/sol-de-dentro",
  "/produtos/colonia-chuva-clara",
  "/produtos/kit-descoberta",
  "/produtos/difusor-chuva-clara",
];

for (const rota of ROTAS_DE_DETALHE) {
  test(`${rota} responde 200`, async () => {
    const response = await fetchRoute(rota);
    assert.equal(response.status, 200);
  });
}

const ROTAS_INEXISTENTES = [
  "/pagina-que-nao-existe",
  "/produtos/nao-existe",
  "/colecoes/nao-existe",
  "/produtos/um/dois",
  "/sobre/extra",
];

for (const rota of ROTAS_INEXISTENTES) {
  test(`${rota} responde 404`, async () => {
    const response = await fetchRoute(rota);
    assert.equal(response.status, 404);
  });
}

test("a página 404 mantém a casca do site e pede para não indexar", async () => {
  const response = await fetchRoute("/pagina-que-nao-existe");
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(html, /Esta página não existe/);
  assert.match(html, /Voltar ao início/);

  /* Só a head. O payload do RSC repete os metadados como dado serializado
     mais abaixo, então procurar no documento inteiro passa mesmo quando a
     tag não foi renderizada — foi exatamente o que mascarou este caso. */
  const head = html.slice(0, html.indexOf("</head>"));

  /* Uma tag de cada. Duas `<title>` fariam o navegador usar a primeira, que
     é a do layout. */
  const titles = [...head.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]);
  assert.deepEqual(titles, ["Página não encontrada | Nascente"]);

  const robots = [...head.matchAll(/<meta name="robots" content="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(robots, ["noindex, follow"]);
});

test("página real não herda o noindex do 404", async () => {
  const response = await fetchRoute("/produtos");
  const head = (await response.text()).split("</head>")[0];

  assert.equal(response.status, 200);
  assert.match(head, /<meta name="robots" content="index, follow"/);
  assert.doesNotMatch(head, /noindex/);
});
