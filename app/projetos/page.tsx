import { createClient } from '@/lib/supabase/server'
import { requireLogin } from '@/lib/supabase/require-login'
import { ProjetosClient } from '@/components/projetos/ProjetosClient'

export default async function ProjetosPage() {
  const supabase = await createClient()
  const session = await requireLogin()

  const { data: projetos, error } = await supabase
    .from('projetos')
    .select('*')
    .order('entrega', { ascending: false, nullsFirst: false })

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar projetos: {error.message}
      </div>
    )
  }

  return <ProjetosClient projetosIniciais={projetos ?? []} isEditor={session.isEditor} />
}
