'use client'

import { useState } from 'react'
import type { Projeto } from '@/lib/types/database'
import { emitirRelatorioGeral, type CampoAgrupamento } from '@/lib/utils/relatorio'
import { IconRelatorio } from '@/components/ui/IconRelatorio'

const OPCOES_AGRUPAMENTO: { value: CampoAgrupamento | ''; label: string }[] = [
  { value: '', label: 'Sem agrupamento (visão geral)' },
  { value: 'etapa', label: 'Por etapa' },
  { value: 'status', label: 'Por status' },
  { value: 'diretor', label: 'Por diretor' },
  { value: 'gerente', label: 'Por gerente' },
  { value: 'projetista', label: 'Por projetista acústico' },
]

export function RelatorioGeralSection({ projetos }: { projetos: Projeto[] }) {
  const [agrupamento, setAgrupamento] = useState<CampoAgrupamento | ''>('')

  function gerar() {
    emitirRelatorioGeral(projetos, agrupamento || null)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Relatório geral</h2>
      <p className="mb-4 text-sm text-gray-500">
        Emite um relatório com os números gerais dos projetos, podendo ser detalhado por etapa,
        status, diretor, gerente ou projetista acústico.
      </p>

      <div className="flex flex-wrap gap-3">
        <select
          value={agrupamento}
          onChange={(e) => setAgrupamento(e.target.value as CampoAgrupamento | '')}
          className="min-w-[260px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          {OPCOES_AGRUPAMENTO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={gerar}
          className="flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          <IconRelatorio className="h-4 w-4" />
          Gerar relatório
        </button>
      </div>
    </div>
  )
}
