import { createClient } from '@/lib/supabase/server'
import { requireEditor } from '@/lib/supabase/require-editor'
import { BibliotecaClient } from '@/components/biblioteca/BibliotecaClient'

export default async function NormasPage() {
  await requireEditor()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('biblioteca')
    .select('*')
    .eq('categoria', 'normas')
    .order('titulo', { ascending: true })

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar: {error.message}
      </div>
    )
  }

  return <BibliotecaClient categoria="normas" itensIniciais={data ?? []} />
}
