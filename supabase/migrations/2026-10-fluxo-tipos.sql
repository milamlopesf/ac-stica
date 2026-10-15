-- ============================================================================
-- Fluxo de Trabalho: tipos de fluxo nomeados (ex: "Relatório de Medições
-- Acústicas", "Relatório de Consultoria Acústica"), cada um com sua própria
-- sequência de etapas. Rode este arquivo uma única vez no SQL Editor do
-- Supabase, depois de já ter rodado 2026-10-fluxo-trabalho.sql.
-- ============================================================================

create table if not exists fluxo_modelos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz default now()
);

alter table fluxo_modelos enable row level security;
drop policy if exists "leitura autenticada" on fluxo_modelos;
drop policy if exists "editor insere" on fluxo_modelos;
drop policy if exists "editor atualiza" on fluxo_modelos;
drop policy if exists "editor apaga" on fluxo_modelos;
create policy "leitura autenticada" on fluxo_modelos for select
  using (exists (select 1 from profiles where id = auth.uid()));
create policy "editor insere" on fluxo_modelos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on fluxo_modelos for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on fluxo_modelos for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

-- Liga cada etapa do molde a um tipo de fluxo. Se já existirem etapas
-- cadastradas de antes (sem tipo), elas são movidas para um tipo
-- "Fluxo Geral (migrado)" criado automaticamente, pra não perder nada.
alter table fluxo_modelo_etapas add column if not exists modelo_id uuid references fluxo_modelos(id) on delete cascade;

do $$
declare
  modelo_migrado_id uuid;
begin
  if exists (select 1 from fluxo_modelo_etapas where modelo_id is null) then
    insert into fluxo_modelos (nome) values ('Fluxo Geral (migrado)') returning id into modelo_migrado_id;
    update fluxo_modelo_etapas set modelo_id = modelo_migrado_id where modelo_id is null;
  end if;
end $$;

alter table fluxo_modelo_etapas alter column modelo_id set not null;
create index if not exists idx_fluxo_modelo_etapas_modelo on fluxo_modelo_etapas(modelo_id);

-- Rastro de qual tipo de fluxo foi usado em cada instância de projeto
-- (informativo — não afeta fluxos já em andamento).
alter table fluxo_projeto_etapas add column if not exists modelo_id uuid references fluxo_modelos(id) on delete set null;
alter table fluxo_projeto_etapas add column if not exists modelo_nome text;

-- Cadastra os dois tipos de fluxo pedidos, com SLA inicial de 3 dias por
-- etapa (ajuste os dias em Painéis se quiser outro valor por etapa). Só
-- cria se ainda não existir um tipo com esse nome (seguro rodar de novo).
do $$
declare
  id_medicoes uuid;
  id_consultoria uuid;
begin
  if not exists (select 1 from fluxo_modelos where nome = 'Relatório de Medições Acústicas') then
    insert into fluxo_modelos (nome) values ('Relatório de Medições Acústicas') returning id into id_medicoes;
    insert into fluxo_modelo_etapas (modelo_id, nome, ordem, sla_dias) values
      (id_medicoes, 'Exportar dados', 1, 3),
      (id_medicoes, 'Organizar fotos da vistoria', 2, 3),
      (id_medicoes, 'Tratar dados de medição', 3, 3),
      (id_medicoes, 'Montar relatório', 4, 3);
  end if;

  if not exists (select 1 from fluxo_modelos where nome = 'Relatório de Consultoria Acústica') then
    insert into fluxo_modelos (nome) values ('Relatório de Consultoria Acústica') returning id into id_consultoria;
    insert into fluxo_modelo_etapas (modelo_id, nome, ordem, sla_dias) values
      (id_consultoria, 'Montar base do relatório com plantas', 1, 3),
      (id_consultoria, 'Analisar isolamento acústico', 2, 3),
      (id_consultoria, 'Analisar condicionamento acústico e infraestrutura (calhas e HVAC)', 3, 3);
  end if;
end $$;
