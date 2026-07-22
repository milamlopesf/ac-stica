import { createClient } from '@/lib/supabase/server'
import { requireLogin } from '@/lib/supabase/require-login'
import { BibliotecaClient } from '@/components/biblioteca/BibliotecaClient'

export default async function LaudosPage() {
  const supabase = await createClient()
  const session = await requireLogin()

  const { data, error } = await supabase
    .from('biblioteca')
    .select('*')
    .eq('categoria', 'laudos')
    .order('titulo', { ascending: true })

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar: {error.message}
      </div>
    )
  }

  return <BibliotecaClient categoria="laudos" itensIniciais={data ?? []} isEditor={session.isEditor} />
}
