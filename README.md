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

O schema (tabelas `projetos`, `atividades`, `notas`, `reunioes`, `anexos`, `profiles`) e as
políticas de RLS já devem existir no projeto Supabase antes de rodar a aplicação.

### Storage

O bucket `anexos-projetos` (privado) precisa de políticas de RLS na tabela `storage.objects`
além das políticas já aplicadas na tabela `anexos` — leitura para qualquer usuário autenticado
(ou público, conforme a necessidade) e escrita/exclusão apenas para quem tem `role = 'editor'`
em `profiles`. Sem essas políticas, upload/download de PDFs retornarão erro de permissão mesmo
com a tabela `anexos` liberada.

## Estrutura

- `app/projetos` — grade de cards de projetos e painel de detalhe (abas: anotações, atas,
  atividades, anexos)
- `app/atividades` — lista de atividades de todos os projetos, agrupada por status (editor)
- `app/calendario` — visão mensal de entregas de projetos e vencimentos de atividades (editor)
- `app/paineis` — números e gráficos de rosca para apresentação
- `lib/supabase` — clientes Supabase (browser, server, middleware/proxy) e helpers de sessão
- `lib/types/database.ts` — tipos TypeScript do schema

## Controle de acesso

- Visitante não autenticado: acesso de leitura a `/projetos` e `/paineis`.
- Usuário autenticado com `profiles.role = 'editor'`: acesso completo, incluindo
  `/atividades`, `/calendario` e os controles de criação/edição/exclusão.

## Deploy

Projeto pronto para deploy na [Vercel](https://vercel.com/new). Configure as mesmas variáveis
de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) no painel do projeto.
