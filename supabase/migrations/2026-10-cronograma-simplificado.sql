-- Simplifica o Cronograma: troca os 4 campos de data (aprovação
-- planejada/realizada, publicação planejada/realizada) por só 3: data
-- inicial, data final e "concluída?" (data_conclusao é preenchida
-- automaticamente quando marcada concluída, editável depois). Os dados
-- existentes são migrados: data_inicio/data_fim a partir das datas já
-- cadastradas, concluido=true (com data_conclusao) pra quem já tinha
-- publicação realizada. Seguro para rodar de novo.

alter table cronograma_etapas add column if not exists data_inicio date;
alter table cronograma_etapas add column if not exists data_fim date;
alter table cronograma_etapas add column if not exists concluido boolean not null default false;
alter table cronograma_etapas add column if not exists data_conclusao date;

update cronograma_etapas
set
  data_inicio = coalesce(data_inicio, aprovacao_planejado, aprovacao_realizado, publicacao_planejado, publicacao_realizado),
  data_fim = coalesce(data_fim, publicacao_planejado, publicacao_realizado, aprovacao_planejado, aprovacao_realizado),
  concluido = concluido or (publicacao_realizado is not null),
  data_conclusao = coalesce(data_conclusao, publicacao_realizado)
where aprovacao_planejado is not null
   or aprovacao_realizado is not null
   or publicacao_planejado is not null
   or publicacao_realizado is not null;

alter table cronograma_etapas drop column if exists aprovacao_planejado;
alter table cronograma_etapas drop column if exists aprovacao_realizado;
alter table cronograma_etapas drop column if exists publicacao_planejado;
alter table cronograma_etapas drop column if exists publicacao_realizado;
