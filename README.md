# Nascente Casa Olfativa

Loja conceitual de perfumaria autoral, construída em Next.js sobre Vinext e Vite,
com execução nativa no Cloudflare Workers.

Projeto autoral de portfólio da [Varanda Estúdio Web](https://varandaestudioweb.com).
Marca, produtos e operação são fictícios; nenhuma compra é processada.

## Requisitos

- Node.js 22.13 ou superior
- npm

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Verificações

```bash
npm run lint        # ESLint
npm test            # build de produção + teste de renderização
node scripts/check-search.mjs   # verificação funcional no navegador
node scripts/shot.mjs           # capturas de tela das rotas principais
```

Os dois últimos exigem Playwright com Chromium instalado:

```bash
npx playwright install chromium
```

## Estrutura

```
app/
  layout.tsx        metadados, fontes e ordem das folhas de estilo
  page.tsx          entrada da home
  [...slug]/        rota única que resolve todas as páginas
  tokens.css        variáveis de design (cor, tipografia, espaço, movimento)
  base.css          reset, primitivas de texto, botões e campos
  shell.css         cabeçalho, busca, gaveta da sacola e rodapé
  editorial.css     hero, coleções, manifesto, linha do tempo, guia olfativo
  commerce.css      catálogo, filtros, produto, frete, checkout
components/
  storefront.tsx    roteador e composição da casca
  cart.tsx          estado da sacola (Context + localStorage)
  shell.tsx         cabeçalho, busca, gaveta e rodapé
  ui.tsx            imagem responsiva, revelação, foco preso, progresso
  product-card.tsx  cartão de produto
  page-*.tsx        uma página por arquivo
lib/
  catalog.ts        coleções e produtos
  filters.ts        filtros, ordenação e busca
  guide.ts          questionário do guia olfativo e apuração
  images.ts         montagem de srcset e larguras por contexto
  shipping.ts       estimativa ilustrativa de frete por CEP
public/images/
  hq/               originais em WebP
  r/                variantes responsivas (400/800/1200/1600, WebP e AVIF)
scripts/
  optimize-images.mjs   gera as variantes de r/ com ffmpeg
  shot.mjs              capturas de tela via Playwright
  check-search.mjs      verificação funcional de busca e cabeçalho
worker/               entrada do Cloudflare Workers
wrangler.jsonc        configuração de publicação
```

### Sobre as imagens em `public/images/r/`

São geradas por `scripts/optimize-images.mjs`, que depende de **ffmpeg local**.
Como o ffmpeg não existe no ambiente de build do Cloudflare, essas variantes
são versionadas no repositório de propósito. Para regerá-las depois de trocar
alguma foto em `hq/`:

```bash
node scripts/optimize-images.mjs
```

## Publicação no Cloudflare pelo GitHub

1. No painel do Cloudflare, acesse **Workers & Pages** e importe um repositório Git.
2. Selecione `luckfero/nascente-casa-olfativa`, branch de produção `main`.
3. Comando de build: `npm run build`
4. Comando de deploy: `npx wrangler deploy`
5. Não é preciso informar diretório de saída — o Wrangler usa `wrangler.jsonc`
   e publica `dist/client` junto ao Worker.

Depois do primeiro deploy, defina `NEXT_PUBLIC_SITE_URL` com a URL pública e
publique de novo. Ela ativa as URLs absolutas dos metadados sociais, do
`robots.txt` e do sitemap.

O projeto não depende de banco de dados nem de chaves de API.

### Nota sobre `compatibility_date`

Está fixada em `2026-05-22` para acompanhar a versão do `workerd` instalada
pelo `wrangler` atual. Datas futuras impedem o `npm run dev` de iniciar
localmente com a mensagem `The Workers runtime failed to start`.

## Publicação pelo terminal

```bash
npm ci
npm run deploy
```
