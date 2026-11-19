-- Foto de cada diretor/gerente da equipe, casada pelo nome com os campos
-- livres projetos.diretor / projetos.gerente. Mostrada no card e na lista
-- de projetos, no painel de detalhe e no relatório em PDF. Cadastro feito
-- em Painéis → "Diretores e Gerentes". Seguro para rodar de novo.

create table if not exists pessoas_equipe (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  foto_storage text,
  created_at timestamptz default now()
);

alter table pessoas_equipe enable row level security;

insert into storage.buckets (id, name, public)
select 'fotos-equipe', 'fotos-equipe', false
where not exists (select 1 from storage.buckets where id = 'fotos-equipe');

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'pessoas_equipe' and policyname = 'leitura autenticada'
  ) then
    create policy "leitura autenticada" on pessoas_equipe for select
      using (exists (select 1 from profiles where id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'pessoas_equipe' and policyname = 'editor insere'
  ) then
    create policy "editor insere" on pessoas_equipe for insert
      with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'pessoas_equipe' and policyname = 'editor atualiza'
  ) then
    create policy "editor atualiza" on pessoas_equipe for update
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'pessoas_equipe' and policyname = 'editor apaga'
  ) then
    create policy "editor apaga" on pessoas_equipe for delete
      using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'Leitura autenticada fotos-equipe'
  ) then
    create policy "Leitura autenticada fotos-equipe"
    on storage.objects for select
    using (bucket_id = 'fotos-equipe' and exists (select 1 from profiles where id = auth.uid()));
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'Editores gerenciam fotos-equipe'
  ) then
    create policy "Editores gerenciam fotos-equipe"
    on storage.objects for all
    using (
      bucket_id = 'fotos-equipe'
      and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
    )
    with check (
      bucket_id = 'fotos-equipe'
      and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
    );
  end if;
end $$;
