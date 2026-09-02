import { createClient } from '@/lib/supabase/server'
import { requireLogin } from '@/lib/supabase/require-login'
import { CoberturaClient } from '@/components/cobertura/CoberturaClient'

export default async function CoberturaPage() {
  await requireLogin()
  const supabase = await createClient()
  const { data: projetos, error } = await supabase.from('projetos').select('*')

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar cobertura: {error.message}
      </div>
    )
  }

  return <CoberturaClient projetos={projetos ?? []} />
}
