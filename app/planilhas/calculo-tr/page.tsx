import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireEditor } from '@/lib/supabase/require-editor'
import { CalculoTRClient } from '@/components/planilhas/CalculoTRClient'
import type { CalculoTR, MaterialTR } from '@/lib/types/database'

export default async function CalculoTRPage() {
  await requireEditor()
  const supabase = await createClient()

  const [{ data: calculos, error: erroCalculos }, { data: materiais, error: erroMateriais }] =
    await Promise.all([
      supabase.from('tr_calculos').select('*').order('updated_at', { ascending: false }),
      supabase.from('tr_materiais').select('*').order('categoria', { ascending: true }).order('nome', { ascending: true }),
    ])

  if (erroCalculos || erroMateriais) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar: {(erroCalculos ?? erroMateriais)?.message}
      </div>
    )
  }

  if (!materiais || materiais.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <Link href="/planilhas" className="text-sm text-blue-600 hover:underline">
          ← Voltar para Planilhas de Cálculo
        </Link>
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A biblioteca de materiais ainda não foi importada no banco de dados. Rode os arquivos
          supabase/migrations/2026-09-tr-calculadora-1-schema.sql e
          2026-09-tr-calculadora-2-materiais.sql (nessa ordem) no SQL Editor do Supabase antes de
          usar a calculadora.
        </div>
      </div>
    )
  }

  return (
    <CalculoTRClient
      calculosIniciais={(calculos as CalculoTR[]) ?? []}
      materiais={materiais as MaterialTR[]}
    />
  )
}
