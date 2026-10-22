-- Permite agendar o início de um Fluxo de Trabalho para uma data futura,
-- em vez de só poder iniciar na hora. Seguro para rodar de novo.

alter table fluxo_projeto_etapas add column if not exists data_inicio_agendada date;
