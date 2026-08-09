import { chromium } from "playwright";
const B = "http://localhost:5195";
const ROTAS = ["/pt","/pt/empresa","/pt/servicos","/pt/projetos","/pt/projetos/casa-patio-alto","/pt/contato","/es","/en"];
const b = await chromium.launch();
let ruim = 0;
for (const [rot, w] of [["desktop",1440],["celular",390]]) {
  let erros = [], horiz = 0, menor = 99;
  for (const rota of ROTAS) {
    const c = await b.newContext({ viewport:{width:w,height:844}, deviceScaleFactor: w<500?2:1 });
    const p = await c.newPage();
    p.on("console", m => { if (m.type()==="error") erros.push(m.text().slice(0,70)); });
    p.on("response", r => { if (r.status()>=400 && !r.url().includes("favicon")) erros.push(`${r.status()} ${r.url().split("/").pop()}`); });
    await p.goto(B+rota, { waitUntil:"networkidle", timeout:60000 });
    await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y);await new Promise(x=>setTimeout(x,100));}});
    await p.waitForTimeout(900);
    const r = await p.evaluate(() => {
      const t = [...document.querySelectorAll("body *")].filter(e => {
        const txt=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join("").trim();
        return txt.length>1 && e.getBoundingClientRect().height>0 && !e.closest(".visually-hidden,.skip-link");
      }).map(e=>parseFloat(getComputedStyle(e).fontSize));
      return { menor: Math.min(...t), transborda: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    menor = Math.min(menor, r.menor);
    if (r.transborda) horiz++;
    await c.close();
  }
  const u = [...new Set(erros)];
  ruim += u.length + horiz;
  console.log(`${rot.padEnd(8)} ${ROTAS.length} rotas · menor texto ${menor}px · rolagem horizontal ${horiz} · erros ${u.length}${u.length?" → "+u.slice(0,2).join(" | "):""}`);
}
console.log(ruim===0 ? "\nSem quebras." : `\n${ruim} problema(s).`);
await b.close();
