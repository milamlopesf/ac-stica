'use client'

import { useState } from 'react'
import type { Projeto } from '@/lib/types/database'
import { emitirRelatorioProjeto } from '@/lib/utils/relatorio'
import { IconRelatorio } from '@/components/ui/IconRelatorio'

export function RelatorioProjetoSection({ projetos }: { projetos: Projeto[] }) {
  const [projetoId, setProjetoId] = useState('')

  const opcoes = [...projetos].sort((a, b) => a.nome.localeCompare(b.nome))

  function gerar() {
    const projeto = projetos.find((p) => p.id === projetoId)
    if (!projeto) return
    const vinculadoId =
      projeto.projeto_vinculado_id ??
      projetos.find((p) => p.projeto_vinculado_id === projeto.id)?.id ??
      null
    emitirRelatorioProjeto(projeto, vinculadoId)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Relatório de projeto</h2>
      <p className="mb-4 text-sm text-gray-500">
        Selecione um projeto para emitir um relatório resumido com as informações, anotações, atas
        e anexos registrados.
      </p>

      <div className="flex flex-wrap gap-3">
        <select
          value={projetoId}
          onChange={(e) => setProjetoId(e.target.value)}
          className="min-w-[260px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione um projeto...</option>
          {opcoes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button
          onClick={gerar}
          disabled={!projetoId}
          className="flex items-center gap-1.5 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconRelatorio className="h-4 w-4" />
          Gerar relatório
        </button>
      </div>
    </div>
  )
}
