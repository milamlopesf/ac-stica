# Painel Acústica

Painel de acompanhamento de projetos acústicos, feito em Next.js (App Router) + Supabase.

## Stack

- Next.js 16 (App Router)
- Supabase (Postgres + Auth + Storage) via `@supabase/supabase-js` e `@supabase/ssr`
- Tailwind CSS
- Recharts (gráficos de rosca)

## Configuração

1. Copie `.env.local.example` para `.env.local` e preencha com os dados do projeto Supabase
   (`Project Settings > API`):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

2. Instale as dependências e rode o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

3. Abra [http://localhost:3000](http://localhost:3000).

### Banco de dados

**`supabase/schema.sql` é a fonte da verdade do banco** — tabelas, políticas de RLS e buckets
de Storage, do jeito que estão hoje em produção. Se o projeto Supabase precisar ser recriado do
zero (ou se você estiver retomando este projeto sem o histórico da conversa original), rode esse
arquivo inteiro no SQL Editor de um projeto Supabase novo e ele reconstrói tudo.

Tabelas: `projetos`, `atividades`, `notas`, `reunioes`, `anexos`, `profiles`, `biblioteca`.

### Storage

Dois buckets privados, cada um com política de leitura pública e escrita restrita a
`profiles.role = 'editor'` (ver `supabase/schema.sql`):

- `anexos-projetos` — PDFs anexados a cada projeto (aba "Anexos")
- `biblioteca-documentos` — PDFs/Excel de Normas/Manuais, Planilhas de Cálculo e Laudos/Medições

## Estrutura

- `app/projetos` — grade de cards de projetos e painel de detalhe (abas: anotações, atas,
  atividades, anexos)
- `app/atividades` — lista de atividades de todos os projetos, agrupada por status (editor)
- `app/calendario` — visão mensal de entregas de projetos e vencimentos de atividades (editor)
- `app/normas`, `app/planilhas`, `app/laudos` — biblioteca de documentos (Normas/Manuais e
  Laudos/Medições são públicas; Planilhas de Cálculo exige login de editor)
- `app/paineis` — números, gráficos de rosca e backup de dados (JSON completo / Excel de
  projetos, visível só para editor)
- `components/ui/RichTextEditor.tsx` — editor de texto rico (Tiptap), usado em Anotações, Atas
  de Reunião e na descrição dos itens da biblioteca
- `lib/supabase` — clientes Supabase (browser, server) e helpers de sessão
- `lib/types/database.ts` — tipos TypeScript do schema
- `supabase/schema.sql` — retrato completo do banco (tabelas, RLS, buckets)

## Controle de acesso

- Visitante não autenticado: acesso de leitura a `/projetos`, `/paineis`, `/normas` e `/laudos`.
- Usuário autenticado com `profiles.role = 'editor'`: acesso completo, incluindo
  `/atividades`, `/calendario`, `/planilhas` e os controles de criação/edição/exclusão em
  todas as páginas.

## Deploy

Projeto pronto para deploy na [Vercel](https://vercel.com/new). Configure as mesmas variáveis
de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) no painel do projeto.
