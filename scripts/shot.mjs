/**
 * Captura telas do site local com Playwright.
 *
 *   node scripts/shot.mjs                      # rotas padrão, desktop
 *   node scripts/shot.mjs / /sobre             # rotas específicas
 *   node scripts/shot.mjs --mobile /produtos   # viewport de celular
 *   node scripts/shot.mjs --full /sobre        # página inteira, não só a dobra
 *
 * As imagens vão para .shots/ (ignorado pelo git).
 */
import { chromium } from "playwright";
import { mkdir, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, ".shots");
const BASE = process.env.BASE_URL ?? "http://localhost:5173";

const args = process.argv.slice(2);
const mobile = args.includes("--mobile");
const fullPage = args.includes("--full");
const routes = args.filter((a) => !a.startsWith("--"));

const DEFAULT_ROUTES = ["/", "/produtos", "/produtos/colonia-chuva-clara", "/colecoes/chuva-clara", "/guia-olfativo", "/sobre", "/privacidade"];
const targets = routes.length ? routes : DEFAULT_ROUTES;

const slug = (route) => (route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-"));

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    // O ambiente do preview força movimento reduzido; aqui pedimos o oposto
    // para conseguir ver as animações no estado final.
    reducedMotion: "no-preference",
  });

  const page = await context.newPage();
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().slice(0, 200));
  });

  for (const route of targets) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    // Dá tempo das fontes assentarem e das revelações dispararem.
    await page.waitForTimeout(1400);
    const name = `${slug(route)}${mobile ? "-mobile" : ""}${fullPage ? "-full" : ""}.png`;
    await page.screenshot({ path: join(OUT, name), fullPage });
    console.log(`· ${name}`);
  }

  await browser.close();

  if (errors.length) {
    console.log(`\n${errors.length} erro(s) de console:`);
    for (const error of [...new Set(errors)].slice(0, 8)) console.log(`  ! ${error}`);
  } else {
    console.log("\nNenhum erro de console.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
