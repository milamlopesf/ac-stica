-- Logo do cliente por projeto: aparece perto do nome do projeto nos
-- relatórios em PDF (Emitir Relatório e Vistoria Acústica). Seguro para
-- rodar de novo.

alter table projetos add column if not exists logo_cliente_storage text;

insert into storage.buckets (id, name, public)
select 'logos-clientes', 'logos-clientes', false
where not exists (select 1 from storage.buckets where id = 'logos-clientes');

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'Leitura autenticada logos-clientes'
  ) then
    create policy "Leitura autenticada logos-clientes"
    on storage.objects for select
    using (bucket_id = 'logos-clientes' and exists (select 1 from profiles where id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'Editores gerenciam logos-clientes'
  ) then
    create policy "Editores gerenciam logos-clientes"
    on storage.objects for all
    using (
      bucket_id = 'logos-clientes'
      and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
    )
    with check (
      bucket_id = 'logos-clientes'
      and exists (select 1 from profiles where id = auth.uid() and role = 'editor')
    );
  end if;
end $$;
