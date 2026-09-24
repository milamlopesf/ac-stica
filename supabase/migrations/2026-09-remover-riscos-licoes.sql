-- ============================================================================
-- Remove por completo as tabelas de Riscos e Lições Aprendidas (as abas já
-- tinham sido tiradas da tela do projeto; confirmado com o usuário que
-- nenhum projeto tinha dados cadastrados nelas antes de rodar isto).
-- ============================================================================

drop table if exists riscos;
drop table if exists licoes_aprendidas;
