/**
 * Confere contraste amostrando pixel de verdade, não o CSS.
 *
 * O cálculo por CSS sobe pelos ancestrais procurando fundo opaco. Isso erra
 * quando o fundo é gradiente, imagem ou pseudo-elemento — casos em que ele
 * pode devolver branco (ou o fundo errado) e inventar uma falha.
 *
 * Aqui a captura do elemento é lida pixel a pixel: o tom mais escuro e o
 * mais claro dentro da caixa são, na prática, o texto e o fundo dele.
 */
import { chromium } from "playwright";
import { PNG } from "pngjs";

const ALVOS = [
  ["Varanda  em (hero)",        "https://varandaestudioweb.com/", "h1 em"],
  ["Varanda  section-index",    "https://varandaestudioweb.com/", ".section-index"],
  ["Varanda  /03",              "https://varandaestudioweb.com/", ".project-counter, [class*=counter]"],
  ["Nívora   technical-label",  "https://nivora-construcoes.luccaoliveira123.workers.dev/pt/empresa", "p.technical-label"],
  ["Nívora   aviso conceitual", "https://nivora-construcoes.luccaoliveira123.workers.dev/pt", "footer p"],
  ["Brasa    eyebrow",          "https://brasa-do-vale.luccaoliveira123.workers.dev/contato", "p.eyebrow"],
  ["Brasa    card-number",      "https://brasa-do-vale.luccaoliveira123.workers.dev/", ".card-number"],
  ["Nascente eyebrow",          "https://nascente-casa-olfativa.luccaoliveira123.workers.dev/sobre", "p.eyebrow"],
  ["Nascente toolbar__count",   "https://nascente-casa-olfativa.luccaoliveira123.workers.dev/produtos", ".toolbar__count"],
];

const lum = ([r, g, b]) => {
  const f = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const razao = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
  return (hi + 0.05) / (lo + 0.05);
};

const navegador = await chromium.launch();

for (const [nome, url, seletor] of ALVOS) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1500);
    const el = page.locator(seletor).first();
    if ((await el.count()) === 0) {
      console.log(`${nome.padEnd(26)} (não encontrado)`);
      await ctx.close();
      continue;
    }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);

    const buf = await el.screenshot();
    const png = PNG.sync.read(buf);

    /* Agrupa por luminância: os dois extremos são texto e fundo. */
    let maisEscuro = null;
    let maisClaro = null;
    for (let i = 0; i < png.data.length; i += 4) {
      const px = [png.data[i], png.data[i + 1], png.data[i + 2]];
      if (png.data[i + 3] < 250) continue;
      const l = lum(px);
      if (!maisEscuro || l < lum(maisEscuro)) maisEscuro = px;
      if (!maisClaro || l > lum(maisClaro)) maisClaro = px;
    }
    if (!maisEscuro || !maisClaro) {
      console.log(`${nome.padEnd(26)} (sem pixels opacos)`);
      await ctx.close();
      continue;
    }

    const cr = razao(maisEscuro, maisClaro);
    const info = await el.evaluate((e) => {
      const cs = getComputedStyle(e);
      return { px: Math.round(parseFloat(cs.fontSize) * 10) / 10, peso: parseInt(cs.fontWeight, 10) || 400, txt: (e.textContent || "").trim().slice(0, 28) };
    });
    const grande = info.px >= 24 || (info.px >= 18.66 && info.peso >= 700);
    const min = grande ? 3 : 4.5;
    console.log(
      `${nome.padEnd(26)} ${String(Math.round(cr * 100) / 100).padStart(6)}:1 (min ${min})  ${String(info.px).padStart(5)}px  ${cr >= min ? "passa" : "◀── FALHA"}   "${info.txt}"`,
    );
  } catch (e) {
    console.log(`${nome.padEnd(26)} erro: ${e.message.slice(0, 50)}`);
  }
  await ctx.close();
}

await navegador.close();
