# Nascente Casa Olfativa

Site responsivo de comércio conceitual da Nascente Casa Olfativa, desenvolvido com Next.js, React, Vinext e Vite para execução nativa no Cloudflare Workers.

## Requisitos

- Node.js 22.13 ou superior
- npm

## Desenvolvimento local

```bash
npm ci
npm run dev
```

## Verificações

```bash
npm run lint
npm test
```

O comando de teste também gera a compilação de produção.

## Publicação no Cloudflare pelo GitHub

1. No painel do Cloudflare, acesse **Workers & Pages** e escolha a opção de importar um repositório Git.
2. Selecione `luckfero/nascente-casa-olfativa` e mantenha a branch de produção como `main`.
3. Use `npm run build` como comando de build.
4. Use `npx wrangler deploy` como comando de deploy.
5. Não é necessário informar diretório de saída: o Wrangler usa `wrangler.jsonc` e publica `dist/client` junto ao Worker.

O projeto não depende de banco de dados nem de chaves de API.

Após o primeiro deploy, configure a variável `NEXT_PUBLIC_SITE_URL` com a URL pública final e faça um novo deploy. Ela ativa as URLs absolutas dos metadados sociais, do `robots.txt` e do sitemap. Se um domínio próprio for conectado, use a URL desse domínio.

## Publicação pelo terminal

Após autenticar o Wrangler na sua conta do Cloudflare:

```bash
npm ci
npm run deploy
```

## Estrutura principal

- `app/`: rotas, metadados e estilos
- `components/`: interface e interações da loja
- `lib/`: catálogo e dados dos produtos
- `public/images/hq/`: acervo final de imagens padronizadas
- `worker/`: entrada de execução do Cloudflare Workers
- `wrangler.jsonc`: configuração de publicação
