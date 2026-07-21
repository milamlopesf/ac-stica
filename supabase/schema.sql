-- ============================================================================
-- Painel Acústica — retrato completo do banco de dados (Supabase)
-- ============================================================================
--
-- Este arquivo documenta TUDO que existe hoje no projeto Supabase
-- "acustica-dashboard": tabelas, políticas de RLS e buckets de Storage.
--
-- Ele existe para o caso de perdermos o histórico da conversa com o Claude —
-- com este arquivo + o código do repositório, dá para reconstruir o banco do
-- zero em um projeto Supabase novo, do jeitinho que está hoje em produção.
--
-- NÃO é para rodar contra o banco atual (que já tem tudo isso criado).
-- Serve como documentação / plano de reconstrução caso seja necessário.
--
-- Padrão de permissões (RLS) usado em todas as tabelas do app:
--   - leitura (select): pública, qualquer pessoa
--   - inserir/atualizar/apagar: só quem tem profiles.role = 'editor'
-- ============================================================================


-- ============================================================================
-- 1. TABELAS PRINCIPAIS (schema original do app)
-- ============================================================================

create table projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  etapa text not null check (etapa in ('DNN','EP','AP','EX','OBRA','GARANTIA')),
  status text not null check (status in ('A Fazer','Em Andamento','Concluído','Atrasado')),
  entrega date,
  diretor text,
  gerente text,
  projetista text,
  projeto_vinculado_id uuid references projetos(id) on delete set null
    constraint projetos_vinculado_nao_self check (projeto_vinculado_id is distinct from id),
  created_at timestamptz default now()
);

create index idx_projetos_vinculado on projetos(projeto_vinculado_id);

create table atividades (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id) on delete cascade,
  texto text not null,
  status text not null default 'pendente' check (status in ('pendente','andamento','concluido')),
  prioridade text default 'Média' check (prioridade in ('Baixa','Média','Alta','Urgente')),
  data_vencimento date,
  progresso int default 0 check (progresso between 0 and 100),
  etapa text,
  diretor text,
  gerente text,
  projetista text,
  created_at timestamptz default now()
);

create table notas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id) on delete cascade,
  texto text not null,
  created_at timestamptz default now()
);

create table reunioes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id) on delete cascade,
  titulo text not null,
  data date not null,
  conteudo text,
  created_at timestamptz default now()
);

create table anexos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid references projetos(id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null,
  tamanho_bytes int,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer' check (role in ('viewer','editor'))
);


-- ============================================================================
-- 2. BIBLIOTECA DE DOCUMENTOS (Normas/Manuais, Planilhas de Cálculo, Laudos/Medições)
-- ============================================================================

create table biblioteca (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('normas', 'planilhas', 'laudos')),
  titulo text not null,
  descricao text,
  fornecedor text,
  rw text,
  nome_arquivo text not null,
  caminho_storage text not null,
  tamanho_bytes int,
  created_at timestamptz default now()
);


-- ============================================================================
-- 3. RLS — habilitar em todas as tabelas
-- ============================================================================

alter table projetos enable row level security;
alter table atividades enable row level security;
alter table notas enable row level security;
alter table reunioes enable row level security;
alter table anexos enable row level security;
alter table profiles enable row level security;
alter table biblioteca enable row level security;


-- ============================================================================
-- 4. RLS — políticas (leitura pública, escrita só para editor)
-- ============================================================================

-- projetos
create policy "leitura publica" on projetos for select using (true);
create policy "editor insere" on projetos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on projetos for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on projetos for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- atividades
create policy "leitura publica" on atividades for select using (true);
create policy "editor insere" on atividades for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on atividades for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on atividades for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- notas
create policy "leitura publica" on notas for select using (true);
create policy "editor insere" on notas for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on notas for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on notas for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- reunioes
create policy "leitura publica" on reunioes for select using (true);
create policy "editor insere" on reunioes for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on reunioes for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on reunioes for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- anexos
create policy "leitura publica" on anexos for select using (true);
create policy "editor insere" on anexos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on anexos for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on anexos for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- biblioteca
create policy "leitura publica" on biblioteca for select using (true);
create policy "editor insere" on biblioteca for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on biblioteca for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on biblioteca for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- profiles: qualquer pessoa pode ler (necessário para o app checar se alguém é
-- editor). Não existe tela no app para criar/editar/apagar profiles — isso é
-- feito manualmente via SQL Editor (que roda como owner do banco e ignora RLS),
-- então não há políticas de insert/update/delete aqui de propósito.
create policy "leitura publica" on profiles for select using (true);


-- ============================================================================
-- 5. STORAGE — buckets e políticas
-- ============================================================================

-- Bucket "anexos-projetos": PDFs anexados a cada projeto (aba Anexos)
insert into storage.buckets (id, name, public) values ('anexos-projetos', 'anexos-projetos', false);

create policy "Leitura publica anexos-projetos"
on storage.objects for select
using (bucket_id = 'anexos-projetos');

create policy "Editores gerenciam anexos-projetos"
on storage.objects for all
using (
  bucket_id = 'anexos-projetos'
  and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
)
with check (
  bucket_id = 'anexos-projetos'
  and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
);

-- Bucket "biblioteca-documentos": PDFs/Excel de Normas, Planilhas e Laudos
insert into storage.buckets (id, name, public) values ('biblioteca-documentos', 'biblioteca-documentos', false);

create policy "Leitura publica biblioteca-documentos"
on storage.objects for select
using (bucket_id = 'biblioteca-documentos');

create policy "Editores gerenciam biblioteca-documentos"
on storage.objects for all
using (
  bucket_id = 'biblioteca-documentos'
  and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
)
with check (
  bucket_id = 'biblioteca-documentos'
  and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
);


-- ============================================================================
-- 6. Como promover um usuário a editor
-- ============================================================================
--
-- 1. Crie o usuário em Authentication > Users (marque "Auto Confirm User")
-- 2. Rode, trocando o e-mail:
--
-- insert into profiles (id, email, role)
-- select id, email, 'editor'
-- from auth.users
-- where email = 'email-da-pessoa@exemplo.com'
-- on conflict (id) do update set role = 'editor';
-- ============================================================================
