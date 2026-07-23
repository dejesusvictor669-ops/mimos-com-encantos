# Mimos com Encanto — Site + Painel Administrativo

Site responsivo para loja de presentes personalizados, com carrinho de compras,
checkout via WhatsApp, acompanhamento de pedido por código e um painel
administrativo exclusivo (login e senha) para gerenciar produtos, avaliações
de clientes e status dos pedidos.

## Estrutura do projeto

```
mimos-com-encanto/
├── index.html                 → página inicial + catálogo + carrinho
├── avaliacoes.html            → todas as avaliações de clientes
├── acompanhar-pedido.html     → cliente consulta status pelo código
├── admin/
│   ├── login.html             → login exclusivo da administradora
│   └── dashboard.html         → painel: produtos, avaliações, pedidos
├── css/style.css               → estilo visual do site inteiro
├── js/
│   ├── supabase-config.js     → chaves do Supabase (você vai editar)
│   ├── utils.js                → funções auxiliares
│   ├── cart.js                 → carrinho + checkout
│   ├── catalog.js              → catálogo de produtos
│   ├── reviews.js              → avaliações (lado público)
│   ├── tracking.js             → acompanhamento de pedido
│   ├── footer.js               → rodapé compartilhado
│   └── admin.js                → login + CRUD do painel
└── supabase/schema.sql         → script para criar o banco de dados
```

## Passo 1 — Criar o projeto no Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e clique em **New Project**.
2. Depois que o projeto for criado, vá em **SQL Editor** → **New query**.
3. Cole todo o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas `produtos`, `avaliacoes`, `pedidos`, as permissões de
   segurança (RLS) e os buckets de imagem (`produtos` e `avaliacoes`).

## Passo 2 — Criar o login da administradora (sua prima)

1. No painel do Supabase, vá em **Authentication** → **Users** → **Add user**.
2. Cadastre o e-mail e senha que ela vai usar para entrar no painel
   (`/admin/login.html`). Marque **Auto Confirm User**.
3. Esse é o único login que existe — não há cadastro público, só ela acessa.

> Só quem estiver logado com essa conta consegue criar, editar ou excluir
> produtos e avaliações. Visitantes só podem ver o catálogo, ver avaliações
> e criar pedidos pelo carrinho.

## Passo 3 — Conectar o site ao seu Supabase

Abra `js/supabase-config.js` e preencha com os dados do seu projeto
(em **Project Settings → API** no painel do Supabase):

```js
const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-public-aqui';
const WHATSAPP_NUMERO = '5531972667424'; // já preenchido com o número da loja
```

⚠️ Use sempre a chave **anon public**, nunca a `service_role` (essa é secreta).

## Passo 4 — Testar localmente

Como o site usa `fetch`/módulos, é melhor rodar com um servidor local em vez
de abrir o HTML direto no navegador. Se tiver Node instalado:

```bash
npx serve .
```

Ou, se preferir, instale a extensão **Live Server** no VS Code e clique em
"Go Live".

## Passo 5 — Publicar no Vercel

1. Suba esta pasta para um repositório no GitHub (do jeito que você já fez
   no FinanceHub).
2. No [vercel.com](https://vercel.com), clique em **Add New → Project** e
   importe o repositório.
3. Como é um site estático (sem build), pode deixar **Framework Preset** como
   **Other** — não precisa configurar build command nem output directory.
4. Clique em **Deploy**. Pronto, o site fica no ar com HTTPS automático.

## Como sua prima vai usar o painel

1. Acessa `seusite.vercel.app/admin/login.html`.
2. Entra com o e-mail/senha criados no Passo 2.
3. Na aba **Produtos**: cadastra nome, descrição, preço, foto, ocasião
   (Dia das Mães, Namorados, etc.) e tipo de presente (cestas, canecas...).
   Pode ocultar um produto sem excluir, desmarcando "Visível no site".
4. Na aba **Avaliações**: adiciona o nome do cliente, nota, comentário e a
   foto do pedido entregue.
5. Na aba **Pedidos**: vê todos os pedidos feitos pelo site e atualiza o
   status (pendente → confirmado → preparando → pronto → entregue). O
   cliente acompanha essa mesma informação em tempo real pela página
   "Acompanhar Pedido" usando o código que recebeu no WhatsApp.

## Fluxo de compra do cliente

1. Navega pelo catálogo, filtra por data ou tipo de presente, adiciona itens
   ao carrinho.
2. Clica em "Finalizar pedido", preenche nome e WhatsApp.
3. O pedido é salvo no banco com um código único (ex: `ME-7F3K9Q`) e o
   cliente é redirecionado ao WhatsApp da loja com a lista de itens já
   pronta para confirmar forma de pagamento e prazo.
4. A qualquer momento, o cliente pode voltar ao site e digitar o código em
   "Acompanhar Pedido" para ver a etapa atual.

## Próximos passos sugeridos (quando quiser evoluir)

- PWA (para "instalar" o site como app no celular).
- Envio automático de notificação por WhatsApp quando o status mudar.
- Página de recuperação de senha para a administradora.
- Múltiplas fotos por produto (galeria).

Qualquer coisa, é só me chamar que a gente ajusta ou evolui juntos. 🎁
