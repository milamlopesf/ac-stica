-- ============================================================================
-- Adiciona à Biblioteca (categoria "laudos") o tipo de instalação da
-- vedação (Junta seca / Encaixilhado) e a espessura do vidro.
-- ============================================================================

alter table biblioteca add column if not exists tipo_instalacao text;
alter table biblioteca add column if not exists espessura_vidro text;
