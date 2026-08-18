'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AvaliacaoProjetista, NotaAvaliacao } from '@/lib/types/database'
import { CORES_NOTA_AVALIACAO, NOTAS_AVALIACAO } from '@/lib/utils/cores'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { htmlEstaVazio } from '@/lib/utils/texto'
import { Badge } from '@/components/ui/Badge'

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function AvaliacaoProjetistaTab({
  projetoId,
  projetista,
  isEditor,
}: {
  projetoId: string
  projetista: string
  isEditor: boolean
}) {
  const supabase = createClient()
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoProjetista[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nota, setNota] = useState<NotaAvaliacao | ''>('')
  const [diagnostico, setDiagnostico] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase
      .from('avaliacoes_projetista')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setAvaliacoes((data as AvaliacaoProjetista[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!nota) return
    setEnviando(true)
    const { data, error } = await supabase
      .from('avaliacoes_projetista')
      .insert({
        projeto_id: projetoId,
        projetista,
        nota,
        diagnostico: htmlEstaVazio(diagnostico) ? null : diagnostico,
      })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar avaliação: ${error.message}`)
      return
    }
    setAvaliacoes((prev) => [data as AvaliacaoProjetista, ...prev])
    setNota('')
    setDiagnostico('')
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta avaliação?')) return
    const { error } = await supabase.from('avaliacoes_projetista').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setAvaliacoes((prev) => prev.filter((a) => a.id !== id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-400">
        Diagnóstico sobre a entrega de <span className="font-medium text-gray-600">{projetista}</span> neste
        projeto.
      </p>

      {isEditor && (
        <form onSubmit={adicionar} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {NOTAS_AVALIACAO.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNota(n)}
                className={
                  'rounded-full border px-3 py-1 text-xs font-medium ' +
                  (nota === n ? CORES_NOTA_AVALIACAO[n].badge : 'border-gray-300 text-gray-500 hover:bg-gray-50')
                }
              >
                {n}
              </button>
            ))}
          </div>
          <RichTextEditor
            value={diagnostico}
            onChange={setDiagnostico}
            placeholder="Diagnóstico da entrega (prazo, qualidade, comunicação...)"
            pastaImagens={projetoId}
          />
          <button
            type="submit"
            disabled={enviando || !nota}
            className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>
      )}

      {avaliacoes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhuma avaliação registrada ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {avaliacoes.map((avaliacao) => (
            <li key={avaliacao.id} className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge label={avaliacao.nota} className={CORES_NOTA_AVALIACAO[avaliacao.nota].badge} />
                  <span className="text-xs text-gray-400">{formatarDataHora(avaliacao.created_at)}</span>
                </div>
                {isEditor && (
                  <button
                    onClick={() => excluir(avaliacao.id)}
                    className="shrink-0 text-gray-400 hover:text-red-600"
                    aria-label="Excluir avaliação"
                  >
                    ✕
                  </button>
                )}
              </div>
              {avaliacao.diagnostico && (
                <div className="mt-1.5 min-w-0">
                  <RichTextEditor value={avaliacao.diagnostico} editable={false} mostrarBarra={false} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
