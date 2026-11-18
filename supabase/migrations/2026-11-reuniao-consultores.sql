-- Nova aba "Reunião Consultores": atas e listas de tarefas da reunião
-- semanal com a diretoria, independente de projeto. Cria a tabela
-- reunioes_consultores (cabeçalho: data, título, participantes, pauta em
-- rich text) e reunioes_consultores_tarefas (checklist de tarefas de cada
-- reunião). Seguro para rodar de novo.

create table if not exists reunioes_consultores (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  titulo text not null,
  participantes text,
  pauta text,
  created_at timestamptz default now()
);

create table if not exists reunioes_consultores_tarefas (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid not null references reunioes_consultores(id) on delete cascade,
  texto text not null,
  responsavel text,
  concluido boolean not null default false,
  concluido_em date,
  ordem int not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_reunioes_consultores_tarefas_reuniao on reunioes_consultores_tarefas(reuniao_id);

alter table reunioes_consultores enable row level security;
alter table reunioes_consultores_tarefas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores' and policyname = 'leitura autenticada'
  ) then
    create policy "leitura autenticada" on reunioes_consultores for select
      using (exists (select 1 from profiles where id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores' and policyname = 'editor insere'
  ) then
    create policy "editor insere" on reunioes_consultores for insert
      with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores' and policyname = 'editor atualiza'
  ) then
    create policy "editor atualiza" on reunioes_consultores for update
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores' and policyname = 'editor apaga'
  ) then
    create policy "editor apaga" on reunioes_consultores for delete
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores_tarefas' and policyname = 'leitura autenticada'
  ) then
    create policy "leitura autenticada" on reunioes_consultores_tarefas for select
      using (exists (select 1 from profiles where id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores_tarefas' and policyname = 'editor insere'
  ) then
    create policy "editor insere" on reunioes_consultores_tarefas for insert
      with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores_tarefas' and policyname = 'editor atualiza'
  ) then
    create policy "editor atualiza" on reunioes_consultores_tarefas for update
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reunioes_consultores_tarefas' and policyname = 'editor apaga'
  ) then
    create policy "editor apaga" on reunioes_consultores_tarefas for delete
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
end $$;
