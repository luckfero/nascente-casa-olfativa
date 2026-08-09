import { chromium } from "playwright";
import { PNG } from "pngjs";
const lum = ([r,g,b]) => { const f=v=>{const x=v/255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4);}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const razao = (a,b) => { const [hi,lo]=lum(a)>lum(b)?[lum(a),lum(b)]:[lum(b),lum(a)]; return (hi+0.05)/(lo+0.05); };
const B = "http://localhost:5196";
const b = await chromium.launch();

const c = await b.newContext({ viewport:{width:1440,height:900} });
const p = await c.newPage();
await p.goto(B, { waitUntil:"networkidle", timeout:60000 });
await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(x=>setTimeout(x,100));}});
await p.waitForTimeout(1000);
const r = await p.evaluate(() =>
  [...document.querySelectorAll("body *")].filter(e => {
    const txt=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(" ").trim();
    return txt.length>1 && parseFloat(getComputedStyle(e).fontSize) < 11 && e.getBoundingClientRect().height>0 && !e.closest(".sr-only,.skip-link");
  }).map(e => ({ px: Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10,
                 cls: (e.className||"").toString().split(" ")[0] || e.tagName.toLowerCase(),
                 maquete: Boolean(e.closest("[class*=browser]")),
                 txt: (e.textContent||"").trim().slice(0,30) })));
console.log("── ainda abaixo de 11px ──");
for (const o of [...new Map(r.map(x=>[x.cls+x.px,x])).values()].sort((a,b)=>a.px-b.px))
  console.log(`  ${String(o.px).padStart(5)}px ${o.maquete?"[maquete]":"[conteúdo]"} ${o.cls.padEnd(18)} "${o.txt}"`);
await c.close();

console.log("\n── contraste por pixel ──");
for (const [nome, sel] of [["rodapé local",".footer-location"],["rodapé direitos",".footer-copyright"],["link privacidade",".footer-bottom a"],["marca small",".brand small"]]) {
  const cx = await b.newContext({ viewport:{width:1440,height:900} });
  const px2 = await cx.newPage();
  await px2.goto(B, { waitUntil:"networkidle", timeout:60000 });
  await px2.waitForTimeout(900);
  const el = px2.locator(sel).first();
  if (await el.count()===0) { console.log(`  ${nome}: não achou`); await cx.close(); continue; }
  await el.scrollIntoViewIfNeeded(); await px2.waitForTimeout(500);
  const png = PNG.sync.read(await el.screenshot());
  let e1=null,c1=null;
  for (let i=0;i<png.data.length;i+=4){ if(png.data[i+3]<250) continue; const q=[png.data[i],png.data[i+1],png.data[i+2]];
    if(!e1||lum(q)<lum(e1)) e1=q; if(!c1||lum(q)>lum(c1)) c1=q; }
  const cr = razao(e1,c1);
  const info = await el.evaluate(e => Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10);
  console.log(`  ${nome.padEnd(18)} ${String(Math.round(cr*100)/100).padStart(6)}:1  ${String(info).padStart(5)}px  ${cr>=4.5?"passa":"◀── FALHA"}`);
  await cx.close();
}
await b.close();
