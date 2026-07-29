import { createClient } from '@/lib/supabase/server'
import { requireLogin } from '@/lib/supabase/require-login'
import { PaineisClient } from '@/components/paineis/PaineisClient'
import { BackupSection } from '@/components/paineis/BackupSection'

export default async function PaineisPage() {
  const supabase = await createClient()
  const session = await requireLogin()
  const { data: projetos, error } = await supabase.from('projetos').select('*')

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar painéis: {error.message}
      </div>
    )
  }

  const lista = projetos ?? []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Painéis</h1>

      <PaineisClient projetos={lista} />

      {session.isEditor && <BackupSection />}
    </div>
  )
}
