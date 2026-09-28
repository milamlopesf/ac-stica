-- ============================================================================
-- Adiciona à Biblioteca (categoria "laudos") os campos de porta: se tem
-- porta, material, espessura e se é guilhotina.
-- ============================================================================

alter table biblioteca add column if not exists com_porta boolean not null default false;
alter table biblioteca add column if not exists porta_material text;
alter table biblioteca add column if not exists porta_espessura text;
alter table biblioteca add column if not exists porta_guilhotina boolean not null default false;
