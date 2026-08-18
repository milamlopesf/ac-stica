'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { LicaoAprendida } from '@/lib/types/database'

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function LicoesAprendidasTab({
  projetoId,
  vinculadoId,
  isEditor,
}: {
  projetoId: string
  vinculadoId?: string | null
  isEditor: boolean
}) {
  const supabase = createClient()
  const [licoes, setLicoes] = useState<LicaoAprendida[]>([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const idsRelacionados = vinculadoId ? [projetoId, vinculadoId] : [projetoId]

  useEffect(() => {
    let ativo = true
    supabase
      .from('licoes_aprendidas')
      .select('*')
      .in('projeto_id', idsRelacionados)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setLicoes((data as LicaoAprendida[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetoId, vinculadoId, supabase])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    const { data, error } = await supabase
      .from('licoes_aprendidas')
      .insert({ projeto_id: projetoId, texto: texto.trim() })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar: ${error.message}`)
      return
    }
    setLicoes((prev) => [data as LicaoAprendida, ...prev])
    setTexto('')
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta lição aprendida?')) return
    const { error } = await supabase.from('licoes_aprendidas').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setLicoes((prev) => prev.filter((l) => l.id !== id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400">
        O que deu errado em obra e podia ter sido previsto em projeto — registre aqui pra não repetir.
        {vinculadoId && ' Visível tanto na obra quanto no projeto vinculado.'}
      </p>

      {isEditor && (
        <form onSubmit={adicionar} className="flex flex-col gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que aconteceu, e o que deveria ser considerado da próxima vez..."
            rows={3}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>
      )}

      {licoes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhuma lição aprendida registrada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {licoes.map((licao) => (
            <li key={licao.id} className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm text-gray-800">{licao.texto}</p>
                <p className="mt-1 text-xs text-gray-400">{formatarDataHora(licao.created_at)}</p>
              </div>
              {isEditor && (
                <button
                  onClick={() => excluir(licao.id)}
                  className="shrink-0 text-gray-400 hover:text-red-600"
                  aria-label="Excluir lição aprendida"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
