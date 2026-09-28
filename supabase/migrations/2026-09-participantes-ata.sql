-- ============================================================================
-- Adiciona o campo "participantes" (nomes + empresas, texto livre) nas
-- atas de reunião.
-- ============================================================================

alter table reunioes add column if not exists participantes text;
