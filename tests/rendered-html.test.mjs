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
  assert.match(html, /noindex/i);
});
