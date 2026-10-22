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
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
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

/* A CSP vale desde 25/09/2026; até ali era `-Report-Only`. O teste cobra três
   coisas: que o cabeçalho é o que bloqueia, que o de relatório não voltou
   junto (com os dois, o navegador avalia duas políticas e o WebKit volta a
   escrever em toda página que a de relatório "will have no effect"), e as
   diretivas que já valem mesmo com `unsafe-inline` no script, mais o
   `upgrade-insecure-requests`, que só age em política que bloqueia.

   O 404 entra porque é o caso fácil de esquecer: ele é remontado no worker, e
   uma `new Response` nasce sem os cabeçalhos do original. */
for (const [rotulo, rota, status] of [
  ["a home", "/", 200],
  ["a página 404", "/pagina-que-nao-existe", 404],
]) {
  test(`${rotulo} responde com a CSP valendo, sem a de relatório`, async () => {
    const response = await fetchRoute(rota);
    assert.equal(response.status, status);
    assert.equal(
      response.headers.get("content-security-policy-report-only"),
      null,
      `${rota} ainda manda Content-Security-Policy-Report-Only`,
    );
    const csp = response.headers.get("content-security-policy") ?? "";
    for (const diretiva of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ]) {
      assert.ok(csp.includes(diretiva), `${diretiva} ausente na CSP de ${rota}`);
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

/* O `/sitemap.xml` respondia 200 com um `urlset` vazio de 110 bytes, enquanto
   o `app/robots.ts` já tinha decidido, por escrito, não ter mapa nenhum. Duas
   respostas para a mesma pergunta. O `app/sitemap.ts` foi apagado em
   09/09/2026 e a decisão passou a morar só no robots. Este teste é o que
   impede o arquivo de voltar sem que alguém repare. */
test("/sitemap.xml não existe: a decisão de não ter mapa mora só no robots", async () => {
  const response = await fetchRoute("/sitemap.xml");
  assert.notEqual(response.status, 200, "o sitemap voltou a responder 200");

  const robots = await fetchRoute("/robots.txt");
  const corpo = await robots.text();
  assert.equal(robots.status, 200);
  assert.doesNotMatch(corpo, /sitemap/i, "o robots.txt passou a anunciar um mapa que não existe");
});

/* Nenhum travessão no que o visitante lê.

   Este portfólio existe para mostrar o registro de escrita da casa, e o
   registro não tem travessão em lugar nenhum que chegue ao visitante, nem
   dentro de `alt` e `aria-label`, que o leitor de tela lê em voz alta. Em
   09/09/2026 eram 14 em texto de interface mais um `content: "—"` no CSS.
   Comentário de código não conta e não aparece aqui: o que este teste mede é
   o documento servido. */
test("nenhuma rota entrega travessão ao visitante", async () => {
  const rotas = [
    "/", "/produtos", "/colecoes", "/guia-olfativo", "/sobre", "/ajuda",
    "/entregas-e-trocas", "/contato", "/sacola", "/checkout", "/privacidade",
    "/produtos/colonia-chuva-clara", "/colecoes/chuva-clara",
    "/pagina-que-nao-existe",
  ];

  const encontrados = [];
  for (const rota of rotas) {
    const html = await (await fetchRoute(rota)).text();
    const quantos = (html.match(/—/g) || []).length;
    if (quantos > 0) encontrados.push(`${rota}: ${quantos}`);
  }

  assert.deepEqual(encontrados, [], `travessão no documento servido em ${encontrados.join(", ")}`);
});

/* O cartão de link se confere pelos BYTES, nunca pelo código HTTP (regra
   9.30). Rota de imagem que responde não é o mesmo que imagem que existe: o
   `og:image` da Varanda respondeu 200, com content-type de imagem, e zero
   byte, por semanas.

   Aqui a peça é um arquivo estático, então o teste lê o arquivo do disco e
   cobra três coisas: assinatura JPEG, dimensão real no marcador SOF e corpo
   com tamanho de imagem de verdade. Depois compara com o que a head declara,
   que é o outro lado do mesmo erro: declarar 1200x630 e servir outra coisa. */
test("o cartão de link é JPEG de verdade, com a dimensão que a head declara", async () => {
  const { readFile } = await import("node:fs/promises");
  const caminho = new URL("../public/images/og/cartao-1200x630.jpg", import.meta.url);
  const bytes = await readFile(caminho);

  assert.ok(bytes.length > 20_000, `cartão com ${bytes.length} bytes, pequeno demais para ser imagem`);
  assert.ok(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, "sem assinatura JPEG (FF D8 FF)");
  assert.ok(bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9, "sem terminador JPEG (FF D9)");

  /* Percorre os segmentos até o SOF, que é quem carrega a dimensão real. */
  let i = 2;
  let real = null;
  while (i < bytes.length - 1) {
    if (bytes[i] !== 0xff) { i += 1; continue; }
    const marcador = bytes[i + 1];
    if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) { i += 2; continue; }
    const tamanho = bytes.readUInt16BE(i + 2);
    const ehSof = marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc;
    if (ehSof) {
      real = { altura: bytes.readUInt16BE(i + 5), largura: bytes.readUInt16BE(i + 7) };
      break;
    }
    i += 2 + tamanho;
  }

  assert.ok(real, "marcador SOF não encontrado: o arquivo não é JPEG legível");
  assert.deepEqual(real, { largura: 1200, altura: 630 });

  /* E o que a página declara. Só a head, pelo motivo de sempre: o payload do
     RSC repete metadado como dado serializado mais abaixo. */
  const html = await (await fetchRoute("/")).text();
  const head = html.slice(0, html.indexOf("</head>"));

  const imagens = [...head.matchAll(/<meta property="og:image" content="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(imagens.length, 1, `esperava uma og:image na head, achei ${imagens.length}`);
  assert.match(imagens[0], /\/images\/og\/cartao-1200x630\.jpg$/);

  const larguras = [...head.matchAll(/<meta property="og:image:width" content="([^"]+)"/g)].map((m) => m[1]);
  const alturas = [...head.matchAll(/<meta property="og:image:height" content="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(larguras, ["1200"], "og:image:width não bate com o arquivo");
  assert.deepEqual(alturas, ["630"], "og:image:height não bate com o arquivo");
});

/* A borda da Cloudflare injeta o beacon do Web Analytics em toda resposta com
   `accept: text/html`, e ele não passa por este repositório. Com `script-src
   'self'` puro, a política valendo mata a analítica em silêncio. O endereço
   de `script-src` é o que carrega o beacon; o de `connect-src` é seguro para
   um snippet sem `version`, porque o atual envia para `/cdn-cgi/rum` da
   própria origem. O teste existe para que ninguém os apague achando que são
   terceiro esquecido. */
test("a CSP libera o beacon da própria borda", async () => {
  const csp = (await fetchRoute("/")).headers.get("content-security-policy") ?? "";
  assert.match(csp, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/);
  assert.match(csp, /connect-src[^;]*https:\/\/cloudflareinsights\.com/);
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

/* ---- Transição de página pulada ----
   O clique duplo num link abre duas View Transitions seguidas, e o navegador
   pula a primeira rejeitando a `ready` dela. Sem tratamento, isso aparecia no
   console da demonstração como "Uncaught (in promise) AbortError". O Node não
   tem View Transition, então o teste usa um dublê do `document`, e o dublê
   faz o que o Chromium e o WebKit fizeram na medição de 21/10/2026 (9.34): a
   transição nova pula a anterior e rejeita a `ready` dela com DOMException
   AbortError; o callback da pulada roda mesmo assim; `updateCallbackDone` e
   `finished` acompanham o callback, e se ele falhar as três rejeitam com o
   erro dele. */
function documentoComTransicao() {
  let ativa = null;
  const callbacksRodados = [];
  return {
    callbacksRodados,
    startViewTransition(atualizar) {
      if (ativa) ativa.pular(new DOMException("Transition was skipped. New ViewTransition started", "AbortError"));
      let pular;
      const pulo = new Promise((_, rejeitar) => { pular = rejeitar; });
      const updateCallbackDone = new Promise((ok) => setTimeout(ok, 0))
        .then(() => { callbacksRodados.push(atualizar); return atualizar(); })
        .then(() => undefined);
      const transicao = {
        updateCallbackDone,
        ready: Promise.race([updateCallbackDone, pulo]),
        finished: updateCallbackDone.then(() => undefined),
        pular,
        skipTransition: () => pular(new DOMException("Transition was skipped. skipTransition() called", "AbortError")),
      };
      ativa = transicao;
      return transicao;
    },
  };
}

/* Troca, pelo tempo do teste, quem escuta promessa rejeitada sem tratamento:
   o executor do `node --test` contaria a rejeição esperada como falha. */
async function rejeicoesSemTratamento(fazer) {
  const anteriores = process.listeners("unhandledRejection");
  process.removeAllListeners("unhandledRejection");
  const soltas = [];
  const anotar = (motivo) => soltas.push(motivo);
  process.on("unhandledRejection", anotar);
  try {
    await fazer();
    await new Promise((ok) => setTimeout(ok, 50));
  } finally {
    process.off("unhandledRejection", anotar);
    for (const ouvinte of anteriores) process.on("unhandledRejection", ouvinte);
  }
  return soltas;
}

const transicaoDePagina = () => import(new URL("../lib/transicao-de-pagina.ts", import.meta.url).href);

test("clique duplo num link: a transição pulada não deixa promessa rejeitada solta", async () => {
  const { abrirTransicao } = await transicaoDePagina();
  const documento = documentoComTransicao();
  const destinos = [];
  let primeira;

  const soltas = await rejeicoesSemTratamento(async () => {
    primeira = abrirTransicao(documento, async () => { destinos.push("/sobre"); });
    abrirTransicao(documento, async () => { destinos.push("/sobre"); });
  });

  /* O dublê recusou como o navegador recusa: sem isto o teste passaria por
     não ter havido pulo nenhum. */
  const motivo = await primeira.ready.then(() => null, (erro) => erro);
  assert.ok(motivo instanceof DOMException, "a ready da transição pulada devia rejeitar");
  assert.equal(motivo.name, "AbortError");

  assert.deepEqual(soltas.map((erro) => `${erro?.name}: ${erro?.message}`), [], "promessa rejeitada sem tratamento");
  /* A troca de página acontece igual: os dois callbacks rodaram. */
  assert.equal(documento.callbacksRodados.length, 2);
  assert.deepEqual(destinos, ["/sobre", "/sobre"]);
});

test("o site publicado só abre transição pelo caminho que trata o pulo", async () => {
  /* Os testes acima provam a função; este prova que o site usa a função. Lê
     o JavaScript que o build entrega ao navegador: toda chamada a
     `startViewTransition` tem que vir seguida do tratamento da `ready`. Se o
     componente voltar a chamar `document.startViewTransition` direto, a
     chamada nova aparece aqui sem o `.ready.catch`. */
  const { readdir, readFile } = await import("node:fs/promises");
  const pasta = new URL("../dist/client/assets/", import.meta.url);
  const chamadas = [];
  for (const nome of (await readdir(pasta)).filter((n) => n.endsWith(".js"))) {
    const codigo = await readFile(new URL(nome, pasta), "utf8");
    for (const achado of codigo.matchAll(/\.startViewTransition\(/g)) {
      chamadas.push([nome, codigo.slice(achado.index, achado.index + 120)]);
    }
  }
  assert.equal(chamadas.length, 1, `esperava uma chamada a startViewTransition, achei ${chamadas.length}`);
  assert.match(chamadas[0][1], /\.ready\.catch\(/, `${chamadas[0][0]}: chamada sem tratamento da ready`);
});

test("só o pulo é engolido: erro de verdade no callback continua aparecendo", async () => {
  const { abrirTransicao, ignorarPulo } = await transicaoDePagina();

  /* Os três motivos com que o Chromium e o WebKit pulam uma transição
     (medidos em 21/10/2026: outra transição, foto que falhou, callback que
     demorou demais) passam calados. Qualquer outra coisa é relançada. */
  for (const nome of ["AbortError", "InvalidStateError", "TimeoutError"]) {
    assert.doesNotThrow(() => ignorarPulo(new DOMException("pulou", nome)), nome);
  }
  assert.throws(() => ignorarPulo(new DOMException("outra coisa", "NotAllowedError")), /outra coisa/);
  assert.throws(() => ignorarPulo(new TypeError("router quebrou")), TypeError);

  /* Com o callback falhando, as três promessas rejeitam. O teste trata
     `updateCallbackDone` e `finished` ele mesmo, para sobrar só o que sai da
     `ready`: ela tem que continuar avisando, e não ser engolida junto. */
  const soltas = await rejeicoesSemTratamento(async () => {
    const transicao = abrirTransicao(documentoComTransicao(), async () => {
      throw new TypeError("router quebrou");
    });
    transicao.updateCallbackDone.catch(() => {});
    transicao.finished.catch(() => {});
  });
  assert.deepEqual(soltas.map((erro) => `${erro?.name}: ${erro?.message}`), ["TypeError: router quebrou"]);
});

test("as barras do guia crescem por scaleX a partir da esquerda, e não por width", async () => {
  /* Animar `width` recalcula o layout a cada quadro. O preenchimento não tem
     vizinho dentro da trilha, então escalar desenha o mesmo sem layout. Os
     dois jeitos de errar que este teste segura: esquecer o
     `transform-origin` (a barra cresceria do meio para os lados) e passar a
     porcentagem crua para a escala (`scaleX(40)` estoura a trilha, e com o
     `overflow: hidden` dela a barra aparece cheia desde a primeira
     pergunta). */
  const { readFile } = await import("node:fs/promises");
  const css = await readFile(new URL("../app/editorial.css", import.meta.url), "utf8");
  const guia = await readFile(new URL("../components/page-guide.tsx", import.meta.url), "utf8");

  for (const seletor of [".quiz__bar span", ".affinity__track span"]) {
    const regra = new RegExp(`${seletor.replace(/[.]/g, "\\.")}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
    assert.ok(regra, `regra ${seletor} não encontrada`);
    assert.match(regra, /transition:\s*transform\s/, `${seletor} devia transicionar transform`);
    assert.doesNotMatch(regra, /transition:[^;]*\bwidth\b/, `${seletor} ainda transiciona width`);
    assert.match(regra, /transform-origin:\s*left\b/, `${seletor} sem transform-origin à esquerda`);
  }

  assert.doesNotMatch(guia, /style=\{\{\s*width:/, "ainda há barra com width no estilo");
  assert.match(guia, /transform: `scaleX\(\$\{progress \/ 100\}\)`/, "barra do quiz sem a escala de 0 a 1");
  assert.match(guia, /transform: `scaleX\(\$\{entry\.percent \/ 100\}\)`/, "barra de afinidade sem a escala de 0 a 1");
});
