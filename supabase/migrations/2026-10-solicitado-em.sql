-- ============================================================================
-- Adiciona "Solicitado em" ao projeto: campo novo e separado de Entrega,
-- só pra registrar a data em que o projeto foi pedido. Entrega continua
-- igual (prazo, status Atrasado, Calendário, relatório).
-- ============================================================================

alter table projetos add column if not exists solicitado_em date;
