import { createClient } from '@/lib/supabase/server'
import { requireLogin } from '@/lib/supabase/require-login'
import { AtividadesClient } from '@/components/atividades/AtividadesClient'

export default async function AtividadesPage() {
  const session = await requireLogin()
  const supabase = await createClient()

  const [{ data: atividades, error: erroAtividades }, { data: projetos, error: erroProjetos }] =
    await Promise.all([
      supabase.from('atividades').select('*').order('created_at', { ascending: false }),
      supabase.from('projetos').select('*').order('nome', { ascending: true }),
    ])

  if (erroAtividades || erroProjetos) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar atividades: {erroAtividades?.message ?? erroProjetos?.message}
      </div>
    )
  }

  return (
    <AtividadesClient
      atividadesIniciais={atividades ?? []}
      projetos={projetos ?? []}
      isEditor={session.isEditor}
    />
  )
}
