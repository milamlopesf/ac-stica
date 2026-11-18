import { createClient } from '@/lib/supabase/server'
import { requireEditor } from '@/lib/supabase/require-editor'
import { ReuniaoConsultoresClient } from '@/components/reunioes-consultores/ReuniaoConsultoresClient'
import type { ReuniaoConsultores, TarefaReuniaoConsultores } from '@/lib/types/database'

export default async function ReuniaoConsultoresPage() {
  const session = await requireEditor()
  const supabase = await createClient()

  const { data: reunioes, error: erroReunioes } = await supabase
    .from('reunioes_consultores')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })

  if (erroReunioes) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar: {erroReunioes.message}
      </div>
    )
  }

  const ids = (reunioes ?? []).map((r) => r.id)
  const { data: tarefas, error: erroTarefas } = ids.length
    ? await supabase
        .from('reunioes_consultores_tarefas')
        .select('*')
        .in('reuniao_id', ids)
        .order('ordem', { ascending: true })
    : { data: [] as TarefaReuniaoConsultores[], error: null }

  if (erroTarefas) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar tarefas: {erroTarefas.message}
      </div>
    )
  }

  const tarefasPorReuniao = new Map<string, TarefaReuniaoConsultores[]>()
  for (const t of (tarefas as TarefaReuniaoConsultores[]) ?? []) {
    if (!tarefasPorReuniao.has(t.reuniao_id)) tarefasPorReuniao.set(t.reuniao_id, [])
    tarefasPorReuniao.get(t.reuniao_id)!.push(t)
  }

  const reunioesComTarefas = ((reunioes as ReuniaoConsultores[]) ?? []).map((r) => ({
    reuniao: r,
    tarefas: tarefasPorReuniao.get(r.id) ?? [],
  }))

  return (
    <ReuniaoConsultoresClient reunioesIniciais={reunioesComTarefas} isEditor={session.isEditor} />
  )
}
