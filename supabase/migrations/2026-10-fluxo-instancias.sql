-- Permite ter VÁRIAS instâncias de fluxo de trabalho ao mesmo tempo no
-- mesmo projeto (ex: duas vistorias do mesmo tipo em momentos diferentes),
-- cada uma com seu próprio nome editável. Cria a tabela fluxo_instancias
-- (cabeçalho de cada fluxo: nome, modelo, SLA total, prazo, agendamento) e
-- liga fluxo_projeto_etapas a ela via instancia_id, migrando o fluxo único
-- que cada projeto já tinha. Seguro para rodar de novo.

-- 1. Nova tabela: cabeçalho de cada instância de fluxo
create table if not exists fluxo_instancias (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references projetos(id) on delete cascade,
  modelo_id uuid references fluxo_modelos(id) on delete set null,
  nome text not null,
  sla_dias_total int not null,
  data_limite_total date,
  data_inicio_agendada date,
  created_at timestamptz default now()
);

create index if not exists idx_fluxo_instancias_projeto on fluxo_instancias(projeto_id);

alter table fluxo_instancias enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'fluxo_instancias' and policyname = 'leitura autenticada'
  ) then
    create policy "leitura autenticada" on fluxo_instancias for select
      using (exists (select 1 from profiles where id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'fluxo_instancias' and policyname = 'editor insere'
  ) then
    create policy "editor insere" on fluxo_instancias for insert
      with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'fluxo_instancias' and policyname = 'editor atualiza'
  ) then
    create policy "editor atualiza" on fluxo_instancias for update
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'fluxo_instancias' and policyname = 'editor apaga'
  ) then
    create policy "editor apaga" on fluxo_instancias for delete
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
end $$;

-- 2. Migra o fluxo único que cada projeto já tinha pra uma linha em
-- fluxo_instancias, liga via instancia_id e remove as colunas antigas
-- (agora vivem em fluxo_instancias). Só roda se ainda não tiver rodado.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'fluxo_projeto_etapas' and column_name = 'instancia_id'
  ) then
    alter table fluxo_projeto_etapas
      add column instancia_id uuid references fluxo_instancias(id) on delete cascade;

    insert into fluxo_instancias (projeto_id, modelo_id, nome, sla_dias_total, data_limite_total, data_inicio_agendada, created_at)
    select distinct on (projeto_id)
      projeto_id, modelo_id, coalesce(modelo_nome, 'Fluxo de trabalho'), sla_dias_total, data_limite_total, data_inicio_agendada, created_at
    from fluxo_projeto_etapas
    order by projeto_id, ordem asc;

    update fluxo_projeto_etapas fpe
    set instancia_id = fi.id
    from fluxo_instancias fi
    where fi.projeto_id = fpe.projeto_id;

    alter table fluxo_projeto_etapas alter column instancia_id set not null;
    alter table fluxo_projeto_etapas drop column modelo_id;
    alter table fluxo_projeto_etapas drop column modelo_nome;
    alter table fluxo_projeto_etapas drop column sla_dias_total;
    alter table fluxo_projeto_etapas drop column data_limite_total;
    alter table fluxo_projeto_etapas drop column data_inicio_agendada;

    create index if not exists idx_fluxo_projeto_etapas_instancia on fluxo_projeto_etapas(instancia_id);
  end if;
end $$;
