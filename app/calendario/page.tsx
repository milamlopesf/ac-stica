import { createClient } from '@/lib/supabase/server'
import { requireEditor } from '@/lib/supabase/require-editor'
import { CalendarioClient, type CronogramaEtapaComProjeto } from '@/components/calendario/CalendarioClient'

export default async function CalendarioPage() {
  await requireEditor()
  const supabase = await createClient()

  const [
    { data: projetos, error: erroProjetos },
    { data: atividades, error: erroAtividades },
    { data: cronograma, error: erroCronograma },
    { data: nomesProjetos, error: erroNomesProjetos },
  ] = await Promise.all([
    supabase.from('projetos').select('*').not('entrega', 'is', null),
    supabase.from('atividades').select('*').not('data_vencimento', 'is', null),
    supabase.from('cronograma_etapas').select('*').not('data_fim', 'is', null),
    supabase.from('projetos').select('id, nome'),
  ])

  if (erroProjetos || erroAtividades || erroCronograma || erroNomesProjetos) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar calendário:{' '}
        {erroProjetos?.message ?? erroAtividades?.message ?? erroCronograma?.message ?? erroNomesProjetos?.message}
      </div>
    )
  }

  const nomePorProjeto = new Map((nomesProjetos ?? []).map((p) => [p.id, p.nome]))
  const cronogramaComProjeto: CronogramaEtapaComProjeto[] = (cronograma ?? []).map((c) => ({
    ...c,
    projetos: nomePorProjeto.has(c.projeto_id) ? { nome: nomePorProjeto.get(c.projeto_id)! } : null,
  }))

  return (
    <CalendarioClient
      projetos={projetos ?? []}
      atividades={atividades ?? []}
      cronograma={cronogramaComProjeto}
    />
  )
}
