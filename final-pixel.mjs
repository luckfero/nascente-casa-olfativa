import { chromium } from "playwright";
import { PNG } from "pngjs";
const lum = ([r,g,b]) => { const f=v=>{const x=v/255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const razao = (a,b) => { const [hi,lo]=lum(a)>lum(b)?[lum(a),lum(b)]:[lum(b),lum(a)]; return (hi+0.05)/(lo+0.05); };
const ALVOS = [
  ["Brasa  card-number",    "http://localhost:5197/", ".card-number"],
  ["Brasa  numeral cardápio","http://localhost:5197/cardapio", ".menu-sections article > span"],
  ["Brasa  form-disclaimer","http://localhost:5197/contato", ".form-disclaimer"],
  ["Nasc   toolbar__count", "http://localhost:5198/produtos", ".toolbar__count"],
  ["Nasc   timeline__year", "http://localhost:5198/sobre", ".timeline__year"],
];
const b = await chromium.launch();
for (const [nome, url, sel] of ALVOS) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  try {
    await p.goto(url, { waitUntil:"networkidle", timeout:60000 });
    await p.waitForTimeout(1300);
    const el = p.locator(sel).first();
    if (await el.count()===0) { console.log(`${nome.padEnd(24)} (não encontrado)`); await ctx.close(); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    const png = PNG.sync.read(await el.screenshot());
    let e1=null,c1=null;
    for (let i=0;i<png.data.length;i+=4){ if(png.data[i+3]<250) continue; const q=[png.data[i],png.data[i+1],png.data[i+2]];
      if(!e1||lum(q)<lum(e1)) e1=q; if(!c1||lum(q)>lum(c1)) c1=q; }
    const cr = razao(e1,c1);
    const info = await el.evaluate(e => { const cs=getComputedStyle(e);
      return { px: Math.round(parseFloat(cs.fontSize)*10)/10, peso: parseInt(cs.fontWeight,10)||400 }; });
    const min = (info.px>=24 || (info.px>=18.66 && info.peso>=700)) ? 3 : 4.5;
    console.log(`${nome.padEnd(24)} ${String(Math.round(cr*100)/100).padStart(6)}:1 (min ${min}) ${String(info.px).padStart(5)}px ${cr>=min?"passa":"◀── FALHA"}`);
  } catch(e) { console.log(`${nome.padEnd(24)} erro: ${e.message.slice(0,40)}`); }
  await ctx.close();
}
await b.close();
