-- Campos específicos do modelo "Drywall" em Laudos/Medições (biblioteca):
-- espessura do montante, número (abreviado) de placas, tipo e espessura da
-- lã. Esses campos só aparecem no formulário quando o modelo escolhido é
-- "Drywall"; quando o modelo é "DPT fixa"/"DPT retrátil", aparecem os
-- campos existentes (tipo de instalação, espessura do vidro, porta).
-- Seguro para rodar de novo.

alter table biblioteca add column if not exists espessura_montante text;
alter table biblioteca add column if not exists numero_placas text;
alter table biblioteca add column if not exists tipo_la text;
alter table biblioteca add column if not exists espessura_la text;
