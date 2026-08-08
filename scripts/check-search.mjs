/**
 * Verificação funcional da busca e do cabeçalho progressivo.
 *   node scripts/check-search.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

function report(label, ok, detail = "") {
  console.log(`${ok ? "OK  " : "FALHA"}  ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

/* ---- 1. Busca por URL direta ---- */
await page.goto(`${BASE}/produtos?q=vela`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
let count = await page.locator(".pcard").count();
let title = await page.locator("h1").first().innerText();
report("busca via URL /produtos?q=vela", count > 0 && count < 13, `${count} produtos · título "${title}"`);
report("URL preservou o termo", page.url().includes("q=vela"), page.url().replace(BASE, ""));

/* ---- 2. Busca pela lupa, vindo da home ---- */
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Abrir busca" }).click();
await page.waitForTimeout(400);
const inputVisible = await page.locator("#busca-topo").isVisible();
const inputWidth = await page.locator("#busca-topo").evaluate((el) => el.getBoundingClientRect().width);
report("campo abre na própria barra", inputVisible && inputWidth > 100, `largura ${Math.round(inputWidth)}px`);

await page.locator("#busca-topo").fill("difusor");
await page.keyboard.press("Enter");
await page.waitForTimeout(1500);
count = await page.locator(".pcard").count();
report("busca pela lupa filtra", page.url().includes("q=difusor") && count > 0 && count < 13, `${count} produtos · ${page.url().replace(BASE, "")}`);

/* ---- 3. Busca estando já em /produtos ---- */
await page.getByRole("button", { name: "Abrir busca" }).click();
/* Esperar mais que a transição do campo (--d-base = 320ms), senão o
   Playwright tenta digitar enquanto a largura ainda está animando. */
await page.waitForTimeout(800);
await page.locator("#busca-topo").fill("sabonete");
await page.keyboard.press("Enter");
await page.waitForTimeout(1500);
count = await page.locator(".pcard").count();
report("buscar já estando no catálogo", page.url().includes("q=sabonete") && count > 0 && count < 13, `${count} produtos`);

/* ---- 4. Busca sem resultado ---- */
await page.goto(`${BASE}/produtos?q=zzzzz`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const empty = await page.locator(".empty-state").count();
report("estado de busca vazia", empty === 1);

/* ---- 5. Cabeçalho progressivo ---- */
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const readP = () => page.locator(".header").evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--p")));
const pTop = await readP();
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.45));
await page.waitForTimeout(500);
const pMid = await readP();
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.3));
await page.waitForTimeout(500);
const pEnd = await readP();
report("cabeçalho é gradual", pTop < 0.05 && pMid > 0.2 && pMid < 0.85 && pEnd >= 0.99,
  `topo=${pTop.toFixed(2)} meio=${pMid.toFixed(2)} fim=${pEnd.toFixed(2)}`);

console.log(errors.length ? `\n${errors.length} erro(s) de console:\n  ${[...new Set(errors)].slice(0,5).join("\n  ")}` : "\nNenhum erro de console.");
await browser.close();
