'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Atividade } from '@/lib/types/database'
import { AtividadeRow } from '@/components/atividades/AtividadeRow'

export function AtividadesTab({
  projetoId,
  projetoEntrega,
  isEditor,
}: {
  projetoId: string
  projetoEntrega: string | null
  isEditor: boolean
}) {
  const supabase = createClient()
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoTexto, setNovoTexto] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase
      .from('atividades')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setAtividades((data as Atividade[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoTexto.trim()) return
    setCriando(true)
    const { data, error } = await supabase
      .from('atividades')
      .insert({ projeto_id: projetoId, texto: novoTexto.trim(), data_vencimento: projetoEntrega })
      .select()
      .single()
    setCriando(false)
    if (error) {
      alert(`Erro ao criar atividade: ${error.message}`)
      return
    }
    setAtividades((prev) => [data as Atividade, ...prev])
    setNovoTexto('')
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && (
        <form onSubmit={adicionar} className="flex gap-2">
          <input
            value={novoTexto}
            onChange={(e) => setNovoTexto(e.target.value)}
            placeholder="Nova atividade..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={criando}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>
      )}

      {atividades.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhuma atividade para este projeto.</p>
      ) : (
        <div className="flex flex-col overflow-x-auto">
          {atividades.map((a) => (
            <AtividadeRow
              key={a.id}
              atividade={a}
              isEditor={isEditor}
              onAtualizada={(atualizada) =>
                setAtividades((prev) => prev.map((x) => (x.id === atualizada.id ? atualizada : x)))
              }
              onExcluida={(id) => setAtividades((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
