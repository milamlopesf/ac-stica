import { createClient } from '@/lib/supabase/server'
import { getSessionInfo } from '@/lib/supabase/session'
import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, ETAPAS } from '@/lib/utils/cores'
import { corCategorica } from '@/lib/utils/paleta'
import { DonutChart, type DonutDatum } from '@/components/paineis/DonutChart'
import { BackupSection } from '@/components/paineis/BackupSection'

function agruparPorCampo(
  projetos: Projeto[],
  campo: 'gerente' | 'projetista'
): DonutDatum[] {
  const contagem = new Map<string, number>()
  for (const p of projetos) {
    const chave = p[campo]?.trim() || 'Não atribuído'
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }
  return Array.from(contagem.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor], i) => ({ nome, valor, cor: corCategorica(i) }))
}

export default async function PaineisPage() {
  const supabase = await createClient()
  const session = await getSessionInfo()
  const { data: projetos, error } = await supabase.from('projetos').select('*')

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
        Erro ao carregar painéis: {error.message}
      </div>
    )
  }

  const lista = projetos ?? []

  const porEtapa: DonutDatum[] = ETAPAS.map((etapa) => ({
    nome: CORES_ETAPA[etapa].label,
    valor: lista.filter((p) => p.etapa === etapa).length,
    cor: CORES_ETAPA[etapa].hex,
  })).filter((d) => d.valor > 0)

  const porGerente = agruparPorCampo(lista, 'gerente')
  const porProjetista = agruparPorCampo(lista, 'projetista')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Painéis</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Total de projetos</p>
        <p className="text-4xl font-semibold text-gray-900">{lista.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DonutChart titulo="Projetos por etapa" dados={porEtapa} />
        <DonutChart titulo="Projetos por gerente" dados={porGerente} />
        <DonutChart titulo="Projetos por projetista acústico" dados={porProjetista} />
      </div>

      {session.isEditor && <BackupSection />}
    </div>
  )
}
