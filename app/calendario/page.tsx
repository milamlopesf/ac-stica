import { createClient } from '@/lib/supabase/server'
import { requireLogin } from '@/lib/supabase/require-login'
import { CalendarioClient } from '@/components/calendario/CalendarioClient'

export default async function CalendarioPage() {
  await requireLogin()
  const supabase = await createClient()

  const [{ data: projetos, error: erroProjetos }, { data: atividades, error: erroAtividades }] =
    await Promise.all([
      supabase.from('projetos').select('*').not('entrega', 'is', null),
      supabase.from('atividades').select('*').not('data_vencimento', 'is', null),
    ])

  if (erroProjetos || erroAtividades) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar calendário: {erroProjetos?.message ?? erroAtividades?.message}
      </div>
    )
  }

  return <CalendarioClient projetos={projetos ?? []} atividades={atividades ?? []} />
}
