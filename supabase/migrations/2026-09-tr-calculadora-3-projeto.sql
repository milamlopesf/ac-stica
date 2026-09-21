-- ============================================================================
-- Calculadora de Tempo de Reverberacao (TR) -- passo 3: vincular um cálculo
-- a um projeto existente. Rode DEPOIS dos arquivos 1-schema.sql e
-- 2-materiais.sql.
-- ============================================================================

alter table tr_calculos add column if not exists projeto_id uuid references projetos(id) on delete set null;

create index if not exists idx_tr_calculos_projeto on tr_calculos(projeto_id);
