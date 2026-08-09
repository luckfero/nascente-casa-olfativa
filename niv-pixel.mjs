import { chromium } from "playwright";
import { PNG } from "pngjs";
const lum = ([r,g,b]) => { const f=v=>{const x=v/255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const razao = (a,b) => { const [hi,lo]=lum(a)>lum(b)?[lum(a),lum(b)]:[lum(b),lum(a)]; return (hi+0.05)/(lo+0.05); };
const B = process.env.BASE ?? "http://localhost:5195";
const ALVOS = [
  ["aviso nos indicadores", "/pt", ".home-hero__specs > small"],
  ["aviso no rodapé",       "/pt", ".concept-note"],
  ["ficha: rótulo",         "/pt/projetos/casa-patio-alto", ".case-hero dt"],
  ["legenda da galeria",    "/pt/projetos/casa-patio-alto", ".case-gallery figcaption"],
  ["legenda do diagrama",   "/pt", ".area-diagram__legend > small"],
  ["numeral do cartão",     "/pt/projetos", ".project-tile__meta span"],
];
const b = await chromium.launch();
for (const [nome, rota, sel] of ALVOS) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  try {
    await p.goto(B+rota, { waitUntil:"networkidle", timeout:60000 });
    await p.waitForTimeout(1200);
    const el = p.locator(sel).first();
    if (await el.count() === 0) { console.log(`${nome.padEnd(24)} (não encontrado)`); await ctx.close(); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    const png = PNG.sync.read(await el.screenshot());
    let esc=null, cla=null;
    for (let i=0;i<png.data.length;i+=4) {
      if (png.data[i+3]<250) continue;
      const px=[png.data[i],png.data[i+1],png.data[i+2]];
      if(!esc||lum(px)<lum(esc)) esc=px;
      if(!cla||lum(px)>lum(cla)) cla=px;
    }
    const cr = razao(esc,cla);
    const info = await el.evaluate(e => ({ px: Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10,
                                           peso: parseInt(getComputedStyle(e).fontWeight,10)||400 }));
    const min = (info.px>=24 || (info.px>=18.66 && info.peso>=700)) ? 3 : 4.5;
    console.log(`${nome.padEnd(24)} ${String(Math.round(cr*100)/100).padStart(6)}:1 (min ${min}) ${String(info.px).padStart(5)}px ${cr>=min?"passa":"◀── FALHA"}`);
  } catch(e) { console.log(`${nome.padEnd(24)} erro: ${e.message.slice(0,40)}`); }
  await ctx.close();
}
await b.close();
