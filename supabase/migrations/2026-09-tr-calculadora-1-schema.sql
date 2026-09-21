-- ============================================================================
-- Calculadora de Tempo de Reverberacao (TR) -- passo 1/2: tabelas e RLS.
--
-- Rode este arquivo inteiro uma unica vez no SQL Editor do Supabase, depois
-- rode 2026-09-tr-calculadora-2-materiais.sql (importa a biblioteca de
-- materiais, em blocos menores). Estrutura tambem documentada em
-- supabase/schema.sql (secao 2b).
-- ============================================================================

alter table biblioteca add column if not exists ferramenta text;

-- Marca o item existente "Cálculo de TR" para abrir a calculadora interativa
-- em vez do modal padrão de detalhe/download. Ajuste o "titulo ilike" abaixo
-- se o item na sua biblioteca tiver um título ligeiramente diferente.
update biblioteca set ferramenta = 'calculo_tr'
where categoria = 'planilhas' and titulo ilike '%C%lculo de TR%' and ferramenta is null;

create table if not exists tr_materiais (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  nome text not null,
  unidade text not null default 'coef_area' check (unidade in ('coef_area', 'sabins_por_pessoa')),
  coef_125 numeric(5,3) not null,
  coef_250 numeric(5,3) not null,
  coef_500 numeric(5,3) not null,
  coef_1000 numeric(5,3) not null,
  coef_2000 numeric(5,3) not null,
  coef_4000 numeric(5,3) not null,
  created_at timestamptz default now()
);

create index if not exists idx_tr_materiais_categoria on tr_materiais(categoria);

create table if not exists tr_calculos (
  id uuid primary key default gen_random_uuid(),
  cliente text,
  ambiente text not null,
  comprimento numeric(6,2),
  largura numeric(6,2),
  altura numeric(6,2),
  volume numeric(10,2) not null,
  temperatura numeric(4,1) not null default 25,
  tipo_som text not null check (tipo_som in ('voz', 'musica')),
  tipo_ambiente text not null check (tipo_ambiente in (
    'estudio_radio_voz', 'anfiteatro_voz', 'teatros', 'igrejas_fala', 'igrejas_musica',
    'salas_concerto_classico', 'salas_concerto_romantico', 'salas_aula', 'restaurantes',
    'home_theater_cinema', 'personalizado'
  )),
  tr_alvo_1khz_personalizado numeric(5,3),
  lotacao_total int,
  material_publico_id uuid references tr_materiais(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tr_calculo_superficies (
  id uuid primary key default gen_random_uuid(),
  calculo_id uuid not null references tr_calculos(id) on delete cascade,
  cenario text not null check (cenario in ('atual', 'proposta')),
  material_id uuid not null references tr_materiais(id),
  descricao text,
  area numeric(8,2) not null check (area > 0),
  ordem int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_tr_calculo_superficies_calculo on tr_calculo_superficies(calculo_id);

alter table tr_materiais enable row level security;
alter table tr_calculos enable row level security;
alter table tr_calculo_superficies enable row level security;

drop policy if exists "leitura autenticada" on tr_materiais;
drop policy if exists "editor insere" on tr_materiais;
drop policy if exists "editor atualiza" on tr_materiais;
drop policy if exists "editor apaga" on tr_materiais;
create policy "leitura autenticada" on tr_materiais for select
  using (exists (select 1 from profiles where id = auth.uid()));
create policy "editor insere" on tr_materiais for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on tr_materiais for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on tr_materiais for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

drop policy if exists "leitura autenticada" on tr_calculos;
drop policy if exists "editor insere" on tr_calculos;
drop policy if exists "editor atualiza" on tr_calculos;
drop policy if exists "editor apaga" on tr_calculos;
create policy "leitura autenticada" on tr_calculos for select
  using (exists (select 1 from profiles where id = auth.uid()));
create policy "editor insere" on tr_calculos for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on tr_calculos for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on tr_calculos for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

drop policy if exists "leitura autenticada" on tr_calculo_superficies;
drop policy if exists "editor insere" on tr_calculo_superficies;
drop policy if exists "editor atualiza" on tr_calculo_superficies;
drop policy if exists "editor apaga" on tr_calculo_superficies;
create policy "leitura autenticada" on tr_calculo_superficies for select
  using (exists (select 1 from profiles where id = auth.uid()));
create policy "editor insere" on tr_calculo_superficies for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor atualiza" on tr_calculo_superficies for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
create policy "editor apaga" on tr_calculo_superficies for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

