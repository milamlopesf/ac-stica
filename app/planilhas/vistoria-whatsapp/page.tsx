import { createClient } from '@/lib/supabase/server'
import { requireEditor } from '@/lib/supabase/require-editor'
import { VistoriaWhatsAppClient } from '@/components/planilhas/VistoriaWhatsAppClient'
import type { Projeto } from '@/lib/types/database'

export default async function VistoriaWhatsAppPage() {
  await requireEditor()
  const supabase = await createClient()

  const { data: projetos, error } = await supabase.from('projetos').select('*').order('nome', { ascending: true })

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar: {error.message}
      </div>
    )
  }

  return <VistoriaWhatsAppClient projetosIniciais={(projetos as Projeto[]) ?? []} />
}
