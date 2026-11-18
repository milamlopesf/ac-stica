-- Nova ferramenta em Planilhas de Cálculo: gera a planilha de pendências de
-- vistoria acústica (padrão AW 4738.25) a partir do export de conversa do
-- WhatsApp, sem precisar me pedir pra montar a planilha manualmente. Cria o
-- item na biblioteca que abre a ferramenta (ver biblioteca.ferramenta =
-- 'vistoria_whatsapp' em components/biblioteca/BibliotecaClient.tsx).
-- Seguro para rodar de novo.

insert into biblioteca (categoria, titulo, descricao, ferramenta)
select 'planilhas', 'Vistoria Acústica (WhatsApp)',
  'Sobe o export da conversa do WhatsApp de uma vistoria e gera a planilha de pendências no padrão AW, com tela de revisão antes de baixar em Excel ou PDF.',
  'vistoria_whatsapp'
where not exists (
  select 1 from biblioteca where categoria = 'planilhas' and ferramenta = 'vistoria_whatsapp'
);
