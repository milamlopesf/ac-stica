-- Adiciona o campo "Responsável" em cada etapa do Cronograma. Seguro para
-- rodar de novo.

alter table cronograma_etapas add column if not exists responsavel text;
