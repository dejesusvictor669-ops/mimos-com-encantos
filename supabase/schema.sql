-- ============================================================================
-- Mimos com Encanto — Schema do Supabase
-- Rode este script inteiro no SQL Editor do seu projeto Supabase
-- (Painel Supabase > SQL Editor > New query > colar tudo > Run)
-- ============================================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tabela: produtos
-- ----------------------------------------------------------------------------
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null,
  imagem_url text,
  imagens_adicionais jsonb default '[]'::jsonb,
  ocasiao text default 'outro',   -- ex: dia-das-maes, namorados, aniversario, dia-dos-pais, outro
  categoria text default 'outro', -- ex: cestas, canecas, decoracao, lembrancinhas, kits
  ativo boolean default true,
  destaque boolean default false,
  criado_em timestamptz default now()
);

-- Mantém projetos já existentes compatíveis com o cadastro atual.
alter table produtos add column if not exists imagens_adicionais jsonb default '[]'::jsonb;
alter table produtos add column if not exists ocasiao text default 'outro';
alter table produtos add column if not exists categoria text default 'outro';
alter table produtos add column if not exists ativo boolean default true;
alter table produtos add column if not exists destaque boolean default false;

-- ----------------------------------------------------------------------------
-- Tabela: avaliacoes
-- ----------------------------------------------------------------------------
create table if not exists avaliacoes (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  comentario text,
  nota int check (nota between 1 and 5) default 5,
  foto_url text,
  criado_em timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Tabela: pedidos
-- ----------------------------------------------------------------------------
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo_rastreio text unique not null,
  nome_cliente text,
  telefone_cliente text,
  itens jsonb not null,
  total numeric(10,2),
  valor_entrega numeric(10,2) default 0,
  metodo_entrega text default 'entrega', -- entrega / retirada
  forma_pagamento text default 'pix', -- pix / transferencia / dinheiro
  status text default 'pendente', -- pendente, confirmado, preparando, pronto, entregue
  observacoes text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Mantém projetos já existentes compatíveis com o checkout atual.
alter table pedidos add column if not exists valor_entrega numeric(10,2) default 0;
alter table pedidos add column if not exists metodo_entrega text default 'entrega';
alter table pedidos add column if not exists forma_pagamento text default 'pix';
alter table pedidos add column if not exists observacoes text;
alter table pedidos add column if not exists atualizado_em timestamptz default now();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table produtos enable row level security;
alter table avaliacoes enable row level security;
alter table pedidos enable row level security;

-- PRODUTOS: qualquer visitante pode ver produtos ativos.
drop policy if exists "produtos_select_publico" on produtos;
create policy "produtos_select_publico" on produtos
  for select using (ativo = true);

-- PRODUTOS: apenas usuário autenticado (a admin) pode inserir/editar/excluir.
drop policy if exists "produtos_admin_all" on produtos;
create policy "produtos_admin_all" on produtos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- AVALIAÇÕES: qualquer visitante pode ver.
drop policy if exists "avaliacoes_select_publico" on avaliacoes;
create policy "avaliacoes_select_publico" on avaliacoes
  for select using (true);

-- AVALIAÇÕES: apenas a admin gerencia.
drop policy if exists "avaliacoes_admin_all" on avaliacoes;
create policy "avaliacoes_admin_all" on avaliacoes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- PEDIDOS: qualquer visitante pode CRIAR um pedido (checkout do carrinho).
drop policy if exists "pedidos_insert_publico" on pedidos;
create policy "pedidos_insert_publico" on pedidos
  for insert with check (true);

-- PEDIDOS: só a admin pode listar/editar todos os pedidos.
drop policy if exists "pedidos_admin_all" on pedidos;
create policy "pedidos_admin_all" on pedidos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- Função pública e segura para o cliente consultar 1 pedido pelo código
-- (evita expor a tabela pedidos inteira para visitantes)
-- ============================================================================
create or replace function public.buscar_pedido_por_codigo(p_codigo text)
returns table (
  codigo_rastreio text,
  nome_cliente text,
  itens jsonb,
  total numeric,
  status text,
  observacoes text,
  criado_em timestamptz,
  atualizado_em timestamptz
)
language sql
security definer
set search_path = public
as $$
  select codigo_rastreio, nome_cliente, itens, total, status, observacoes, criado_em, atualizado_em
  from pedidos
  where codigo_rastreio = upper(p_codigo)
  limit 1;
$$;

grant execute on function public.buscar_pedido_por_codigo(text) to anon, authenticated;

-- ============================================================================
-- Storage: buckets para imagens (rode ou crie manualmente pelo painel)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avaliacoes', 'avaliacoes', true)
on conflict (id) do nothing;

-- Leitura pública das imagens
drop policy if exists "leitura_publica_produtos" on storage.objects;
create policy "leitura_publica_produtos" on storage.objects
  for select using (bucket_id = 'produtos');

drop policy if exists "leitura_publica_avaliacoes" on storage.objects;
create policy "leitura_publica_avaliacoes" on storage.objects
  for select using (bucket_id = 'avaliacoes');

-- Upload/edição/exclusão só para a admin autenticada
drop policy if exists "admin_upload_produtos" on storage.objects;
create policy "admin_upload_produtos" on storage.objects
  for insert with check (bucket_id = 'produtos' and auth.role() = 'authenticated');
drop policy if exists "admin_update_produtos" on storage.objects;
create policy "admin_update_produtos" on storage.objects
  for update using (bucket_id = 'produtos' and auth.role() = 'authenticated');
drop policy if exists "admin_delete_produtos" on storage.objects;
create policy "admin_delete_produtos" on storage.objects
  for delete using (bucket_id = 'produtos' and auth.role() = 'authenticated');

drop policy if exists "admin_upload_avaliacoes" on storage.objects;
create policy "admin_upload_avaliacoes" on storage.objects
  for insert with check (bucket_id = 'avaliacoes' and auth.role() = 'authenticated');
drop policy if exists "admin_update_avaliacoes" on storage.objects;
create policy "admin_update_avaliacoes" on storage.objects
  for update using (bucket_id = 'avaliacoes' and auth.role() = 'authenticated');
drop policy if exists "admin_delete_avaliacoes" on storage.objects;
create policy "admin_delete_avaliacoes" on storage.objects
  for delete using (bucket_id = 'avaliacoes' and auth.role() = 'authenticated');
