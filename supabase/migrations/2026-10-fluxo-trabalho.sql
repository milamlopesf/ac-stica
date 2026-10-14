-- ============================================================================
-- Fluxo de Trabalho: molde global de etapas (com SLA em dias) + instância
-- por projeto. Rode este arquivo uma única vez no SQL Editor do Supabase.
-- ============================================================================

create table if not exists fluxo_modelo_etapas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem int not null,
  sla_dias int not null check (sla_dias > 0),
  created_at timestamptz default now()
);

create table if not exists fluxo_projeto_etapas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  nome text not null,
  ordem int not null,
  sla_dias int not null,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluido')),
  data_inicio date,
  data_limite date,
  data_conclusao date,
  created_at timestamptz default now()
);

create index if not exists idx_fluxo_projeto_etapas_projeto on fluxo_projeto_etapas(projeto_id);

alter table fluxo_modelo_etapas enable row level security;
alter table fluxo_projeto_etapas enable row level security;

drop policy if exists "leitura autenticada" on fluxo_modelo_etapas;
drop policy if exists "editor insere" on fluxo_modelo_etapas;
drop policy if exists "editor atualiza" on fluxo_modelo_etapas;
drop policy if exists "editor apaga" on fluxo_modelo_etapas;
create policy "leitura autenticada" on fluxo_modelo_etapas for select
  using (exists (select 1 from profiles where id = auth.uid()));
create policy "editor insere" on fluxo_modelo_etapas for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on fluxo_modelo_etapas for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on fluxo_modelo_etapas for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

drop policy if exists "leitura autenticada" on fluxo_projeto_etapas;
drop policy if exists "editor insere" on fluxo_projeto_etapas;
drop policy if exists "editor atualiza" on fluxo_projeto_etapas;
drop policy if exists "editor apaga" on fluxo_projeto_etapas;
create policy "leitura autenticada" on fluxo_projeto_etapas for select
  using (exists (select 1 from profiles where id = auth.uid()));
create policy "editor insere" on fluxo_projeto_etapas for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on fluxo_projeto_etapas for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on fluxo_projeto_etapas for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
