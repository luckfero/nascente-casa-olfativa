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
  "strict-transport-security": "max-age=86400",
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

test("página real não é servida como a de erro", async () => {
  const response = await fetchRoute("/produtos");
  const head = (await response.text()).split("</head>")[0];

  assert.equal(response.status, 200);

  /* O site inteiro é `noindex, nofollow` desde 2026-08-10: a Nascente é um
     projeto conceitual, e o catálogo com fluxo de compra completo apareceria
     na busca como loja real de uma empresa que não existe. Antes deste teste
     ser reescrito, ele cobrava `index, follow` aqui.

     O que ele guardava continua valendo, e é o motivo de não ter sido
     apagado: a página de erro usa `noindex, follow`, com título próprio, e
     nenhuma página real pode ser servida no lugar dela. A diferença entre
     `nofollow` e `follow` é o que separa as duas. */
  const robots = [...head.matchAll(/<meta name="robots" content="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(robots, ["noindex, nofollow"]);

  const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1]);
  assert.equal(titles.length, 1);
  assert.doesNotMatch(titles[0], /não encontrada/i, "página real recebeu o título do 404");
});

test("HTTP puro não entrega página: redireciona para HTTPS", async () => {
  const wUrl = new URL("../dist/server/index.js", import.meta.url);
  wUrl.searchParams.set("test", `${process.pid}-${Date.now()}-tls`);
  const { default: w } = await import(wUrl.href);

  const pedir = (endereco, cabecalhos = {}) =>
    w.fetch(
      new Request(endereco, { headers: { accept: "text/html", ...cabecalhos } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );

  /* Visitante em texto aberto: 301 para o mesmo caminho em HTTPS. */
  const aberto = await pedir("http://nascente.test/sobre?x=1");
  assert.equal(aberto.status, 301);
  assert.equal(aberto.headers.get("location"), "https://nascente.test/sobre?x=1");

  /* A borda da Cloudflare entrega o esquema original no CF-Visitor. Ele
     manda mais que o endereço: numa borda que já terminou o TLS, a URL
     chega como https mesmo quando o visitante veio de http. */
  const viaBorda = await pedir("https://nascente.test/", { "CF-Visitor": '{"scheme":"http"}' });
  assert.equal(viaBorda.status, 301, "CF-Visitor http deve redirecionar mesmo com URL https");

  /* E o contrário: quem já está em HTTPS **não** pode ser redirecionado,
     senão o destino vira http de novo e o site entra em laço infinito. */
  const seguro = await pedir("https://nascente.test/", { "CF-Visitor": '{"scheme":"https"}' });
  assert.notEqual(seguro.status, 301, "requisição já segura não pode redirecionar");

  /* localhost fica de fora: é onde rodam o dev e estes testes. */
  const local = await pedir("http://localhost/sobre");
  assert.notEqual(local.status, 301, "localhost não pode redirecionar");
});

test("todo SVG do projeto é XML válido", async () => {
  /* Um favicon com XML inválido não avisa: o navegador não faz o parse, não
     renderiza nada, e mantém o ícone anterior. Parece cache e não é.

     Aconteceu aqui: um comentário trazia o nome de uma variável CSS, e
     comentário XML **não pode conter dois hifens seguidos**. O arquivo foi
     publicado, o md5 do que o servidor entregava batia com o do repositório,
     e mesmo assim o ícone não aparecia. Comparar bytes prova que o arquivo
     chegou, não que ele é válido.

     `DOMParser` não existe no Node, então a validação é por regex sobre as
     armadilhas conhecidas de XML, mais uma checagem de tags balanceadas. */
  const { readdir, readFile } = await import("node:fs/promises");
  const dir = new URL("../public/", import.meta.url);

  async function svgsDe(caminho, prefixo = "") {
    const saida = [];
    for (const item of await readdir(caminho, { withFileTypes: true })) {
      const nome = prefixo + item.name;
      if (item.isDirectory()) saida.push(...await svgsDe(new URL(item.name + "/", caminho), nome + "/"));
      else if (item.name.endsWith(".svg")) saida.push([nome, new URL(item.name, caminho)]);
    }
    return saida;
  }

  const arquivos = await svgsDe(dir);
  assert.ok(arquivos.length > 0, "nenhum SVG encontrado em public/");

  for (const [nome, url] of arquivos) {
    const texto = await readFile(url, "utf8");

    for (const comentario of texto.matchAll(/<!--([\s\S]*?)-->/g)) {
      assert.doesNotMatch(
        comentario[1],
        /--/,
        `${nome}: comentário XML com dois hifens seguidos, o que invalida o arquivo inteiro`,
      );
    }

    /* Contar tags exige tirar os comentários antes: o `assinatura.svg` cita
       literalmente uma tag dentro de um aviso, e contá-la dava desequilíbrio
       onde o arquivo estava correto. Foi este teste que errou primeiro. */
    const semComentario = texto.replace(/<!--[\s\S]*?-->/g, "");

    const abre = (semComentario.match(/<(?!\/|!|\?)[a-zA-Z]/g) || []).length;
    const fecha = (semComentario.match(/<\//g) || []).length + (semComentario.match(/\/>/g) || []).length;
    assert.equal(abre, fecha, `${nome}: ${abre} tags abertas contra ${fecha} fechadas`);

    assert.match(semComentario, /<svg[\s>]/, `${nome}: não começa com <svg>`);
    assert.doesNotMatch(semComentario, /&(?!amp;|lt;|gt;|quot;|apos;|#)/, `${nome}: & sem escapar`);
  }
});
