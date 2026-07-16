'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Atividade, Projeto } from '@/lib/types/database'
import { CORES_STATUS_ATIVIDADE, STATUS_ATIVIDADE } from '@/lib/utils/cores'
import { AtividadeRow } from './AtividadeRow'

export function AtividadesClient({
  atividadesIniciais,
  projetos,
}: {
  atividadesIniciais: Atividade[]
  projetos: Projeto[]
}) {
  const supabase = createClient()
  const [atividades, setAtividades] = useState<Atividade[]>(atividadesIniciais)
  const [novoTexto, setNovoTexto] = useState('')
  const [novoProjetoId, setNovoProjetoId] = useState('')
  const [criando, setCriando] = useState(false)

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoTexto.trim()) return
    setCriando(true)
    const { data, error } = await supabase
      .from('atividades')
      .insert({ texto: novoTexto.trim(), projeto_id: novoProjetoId || null })
      .select()
      .single()
    setCriando(false)
    if (error) {
      alert(`Erro ao criar atividade: ${error.message}`)
      return
    }
    setAtividades((prev) => [data as Atividade, ...prev])
    setNovoTexto('')
    setNovoProjetoId('')
  }

  function atualizar(atualizada: Atividade) {
    setAtividades((prev) => prev.map((a) => (a.id === atualizada.id ? atualizada : a)))
  }

  function excluir(id: string) {
    setAtividades((prev) => prev.filter((a) => a.id !== id))
  }

  const grupos = STATUS_ATIVIDADE.map((status) => ({
    status,
    itens: atividades.filter((a) => a.status === status),
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-gray-900">Atividades</h1>

      <form onSubmit={adicionar} className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3">
        <input
          value={novoTexto}
          onChange={(e) => setNovoTexto(e.target.value)}
          placeholder="Nova atividade..."
          className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select
          value={novoProjetoId}
          onChange={(e) => setNovoProjetoId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Sem projeto</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={criando}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>

      <div className="flex flex-col gap-6">
        {grupos.map(({ status, itens }) => {
          const cor = CORES_STATUS_ATIVIDADE[status]
          return (
            <div key={status} className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor.hex }} />
                <h2 className="text-sm font-semibold text-gray-800">{cor.label}</h2>
                <span className="text-xs text-gray-400">({itens.length})</span>
              </div>
              <div className="overflow-x-auto px-4">
                {itens.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">Nenhuma atividade.</p>
                ) : (
                  itens.map((atividade) => (
                    <AtividadeRow
                      key={atividade.id}
                      atividade={atividade}
                      isEditor
                      projetos={projetos}
                      onAtualizada={atualizar}
                      onExcluida={excluir}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
