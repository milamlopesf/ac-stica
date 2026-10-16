-- Troca o SLA do Fluxo de Trabalho de "por etapa" para um prazo TOTAL único
-- por tipo de fluxo (fluxo_modelos.sla_dias). As etapas deixam de ter prazo
-- próprio; o prazo total do fluxo é snapshotado em fluxo_projeto_etapas
-- (sla_dias_total / data_limite_total, mesmo valor em todas as linhas da
-- instância) quando o fluxo é iniciado em um projeto.
-- Seguro para rodar de novo.

-- 1. fluxo_modelos: SLA total do tipo de fluxo
alter table fluxo_modelos add column if not exists sla_dias int;

update fluxo_modelos m
set sla_dias = coalesce(
  (select sum(e.sla_dias) from fluxo_modelo_etapas e where e.modelo_id = m.id),
  10
)
where m.sla_dias is null;

alter table fluxo_modelos alter column sla_dias set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fluxo_modelos_sla_dias_check'
  ) then
    alter table fluxo_modelos add constraint fluxo_modelos_sla_dias_check check (sla_dias > 0);
  end if;
end $$;

-- 2. fluxo_modelo_etapas: remove o SLA por etapa (deixa só nome/ordem)
alter table fluxo_modelo_etapas drop column if exists sla_dias;

-- 3. fluxo_projeto_etapas: troca SLA/prazo por etapa por SLA/prazo total do fluxo
alter table fluxo_projeto_etapas add column if not exists sla_dias_total int;
alter table fluxo_projeto_etapas add column if not exists data_limite_total date;

update fluxo_projeto_etapas fpe
set sla_dias_total = coalesce(
  (select m.sla_dias from fluxo_modelos m where m.id = fpe.modelo_id),
  (select sum(sub.sla_dias) from fluxo_projeto_etapas sub where sub.projeto_id = fpe.projeto_id),
  10
)
where fpe.sla_dias_total is null;

update fluxo_projeto_etapas fpe
set data_limite_total = (
  select min(sub.data_inicio) + fpe.sla_dias_total
  from fluxo_projeto_etapas sub
  where sub.projeto_id = fpe.projeto_id and sub.data_inicio is not null
)
where fpe.data_limite_total is null;

alter table fluxo_projeto_etapas alter column sla_dias_total set not null;
alter table fluxo_projeto_etapas drop column if exists sla_dias;
alter table fluxo_projeto_etapas drop column if exists data_limite;
