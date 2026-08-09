/**
 * Mede tamanho de texto e contraste real, como o navegador renderiza.
 *   node a11y-audit.mjs
 *
 * Contraste é calculado, não lido do CSS: cor com transparência precisa ser
 * composta contra o fundo efetivo, que pode vir de qualquer ancestral.
 */
import { chromium } from "playwright";

const SITES = [
  { nome: "Varanda", rotas: [
    "https://varandaestudioweb.com/",
    "https://varandaestudioweb.com/privacidade",
  ]},
  { nome: "Nascente", rotas: [
    "https://nascente-casa-olfativa.luccaoliveira123.workers.dev/",
    "https://nascente-casa-olfativa.luccaoliveira123.workers.dev/produtos",
    "https://nascente-casa-olfativa.luccaoliveira123.workers.dev/sobre",
  ]},
  { nome: "Brasa", rotas: [
    "https://brasa-do-vale.luccaoliveira123.workers.dev/",
    "https://brasa-do-vale.luccaoliveira123.workers.dev/cardapio",
    "https://brasa-do-vale.luccaoliveira123.workers.dev/contato",
  ]},
  { nome: "Nívora", rotas: [
    "https://nivora-construcoes.luccaoliveira123.workers.dev/pt",
    "https://nivora-construcoes.luccaoliveira123.workers.dev/pt/projetos",
    "https://nivora-construcoes.luccaoliveira123.workers.dev/pt/empresa",
  ]},
];

function medir() {
  const luminancia = ([r, g, b]) => {
    const f = (v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  // O Chrome devolve "rgb(28, 25, 23)" e também "rgb(28 25 23 / 0.5)".
  const parse = (c) => {
    if (!c || c === "transparent") return null;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].replace(/\//g, " ").split(/[\s,]+/).filter(Boolean).map(Number.parseFloat);
    if (p.length < 3 || p.slice(0, 3).some(Number.isNaN)) return null;
    return { rgb: p.slice(0, 3), a: p.length > 3 && !Number.isNaN(p[3]) ? p[3] : 1 };
  };

  const compor = (frente, fundo, a) => frente.map((v, i) => v * a + fundo[i] * (1 - a));

  // Sobe pelos ancestrais empilhando camadas até achar um fundo opaco.
  const fundoDe = (el) => {
    const pilha = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) {
        pilha.push(bg);
        if (bg.a === 1) break;
      }
      n = n.parentElement;
    }
    let cor = [255, 255, 255];
    for (let i = pilha.length - 1; i >= 0; i--) cor = compor(pilha[i].rgb, cor, pilha[i].a);
    return cor;
  };

  const razao = (a, b) => {
    const l1 = luminancia(a);
    const l2 = luminancia(b);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  };

  const achados = [];
  for (const el of document.querySelectorAll("body *")) {
    const txt = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (txt.length < 2) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (Number.parseFloat(cs.opacity) < 0.05) continue;
    // Texto escondido só para leitor de tela não é problema visual.
    if (el.closest(".visually-hidden, .skip-link")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const px = Number.parseFloat(cs.fontSize);
    const peso = Number.parseInt(cs.fontWeight, 10) || 400;
    const fg = parse(cs.color);
    if (!fg) continue;

    const bg = fundoDe(el);
    const cor = fg.a < 1 ? compor(fg.rgb, bg, fg.a) : fg.rgb;
    const cr = razao(cor, bg);

    // WCAG: "texto grande" é >=24px, ou >=18.66px quando em negrito.
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const minimo = grande ? 3 : 4.5;
    // Texto sobre foto não tem fundo sólido para medir — o cálculo mente.
    const sobreImagem = Boolean(el.closest('[class*="hero"], [class*="media"], [class*="overlay"]'));

    achados.push({
      px: Math.round(px * 10) / 10,
      peso,
      cr: Math.round(cr * 100) / 100,
      minimo,
      passa: cr >= minimo,
      sobreImagem,
      txt: txt.slice(0, 42),
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().split(" ")[0].slice(0, 22),
    });
  }
  return achados;
}

const navegador = await chromium.launch();

for (const site of SITES) {
  const todos = [];
  for (const url of site.rotas) {
    const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 110));
      }
    });
    await page.waitForTimeout(1300);
    todos.push(...(await page.evaluate(medir)));
    await ctx.close();
  }

  const chave = (a) => `${a.tag}.${a.cls}|${a.px}|${a.cr}`;
  const unicos = (arr) => [...new Map(arr.map((a) => [chave(a), a])).values()];

  const pequenos = unicos(todos.filter((a) => a.px < 12));
  const baixos = unicos(todos.filter((a) => !a.passa && !a.sobreImagem));
  const sobreFoto = unicos(todos.filter((a) => !a.passa && a.sobreImagem));

  console.log(`\n════ ${site.nome} — ${todos.length} textos em ${site.rotas.length} rotas ════`);

  console.log(`  abaixo de 12px: ${pequenos.length} variação(ões)`);
  for (const a of pequenos.sort((x, y) => x.px - y.px).slice(0, 8)) {
    console.log(`    ${String(a.px).padStart(5)}px peso ${a.peso}  ${(a.tag + "." + a.cls).padEnd(26)} "${a.txt}"`);
  }

  console.log(`  contraste abaixo do mínimo: ${baixos.length} variação(ões)`);
  for (const a of baixos.sort((x, y) => x.cr - y.cr).slice(0, 10)) {
    console.log(`    ${String(a.cr).padStart(5)}:1 (min ${a.minimo})  ${String(a.px).padStart(5)}px  ${(a.tag + "." + a.cls).padEnd(24)} "${a.txt}"`);
  }

  if (sobreFoto.length) {
    console.log(`  (${sobreFoto.length} sobre foto — cálculo não vale, conferir a olho)`);
  }
}

await navegador.close();
