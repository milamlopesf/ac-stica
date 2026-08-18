'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Risco, NivelRisco } from '@/lib/types/database'
import { CORES_NIVEL_RISCO, NIVEIS_RISCO } from '@/lib/utils/cores'
import { calcularCriticidade } from '@/lib/utils/riscos'
import { formatarData } from '@/lib/utils/data'
import { Badge } from '@/components/ui/Badge'

const PESO_ORDENACAO: Record<NivelRisco, number> = { Alto: 3, Médio: 2, Baixo: 1 }

export function RiscosTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [riscos, setRiscos] = useState<Risco[]>([])
  const [carregando, setCarregando] = useState(true)
  const [formAberto, setFormAberto] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [acaoMitigadora, setAcaoMitigadora] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [dataLimite, setDataLimite] = useState('')
  const [probabilidade, setProbabilidade] = useState<NivelRisco | ''>('')
  const [impacto, setImpacto] = useState<NivelRisco | ''>('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase
      .from('riscos')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setRiscos((data as Risco[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  const riscosOrdenados = [...riscos].sort((a, b) => {
    if (a.mitigado !== b.mitigado) return a.mitigado ? 1 : -1
    const critA = calcularCriticidade(a.probabilidade, a.impacto)
    const critB = calcularCriticidade(b.probabilidade, b.impacto)
    return (critB ? PESO_ORDENACAO[critB] : 0) - (critA ? PESO_ORDENACAO[critA] : 0)
  })

  function limparForm() {
    setDescricao('')
    setAcaoMitigadora('')
    setResponsavel('')
    setDataLimite('')
    setProbabilidade('')
    setImpacto('')
    setFormAberto(false)
  }

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) return
    setEnviando(true)
    const { data, error } = await supabase
      .from('riscos')
      .insert({
        projeto_id: projetoId,
        descricao: descricao.trim(),
        acao_mitigadora: acaoMitigadora.trim() || null,
        responsavel: responsavel.trim() || null,
        data_limite: dataLimite || null,
        probabilidade: probabilidade || null,
        impacto: impacto || null,
      })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar risco: ${error.message}`)
      return
    }
    setRiscos((prev) => [data as Risco, ...prev])
    limparForm()
  }

  async function alternarMitigado(risco: Risco) {
    const mitigado = !risco.mitigado
    setRiscos((prev) => prev.map((r) => (r.id === risco.id ? { ...r, mitigado } : r)))
    const { error } = await supabase.from('riscos').update({ mitigado }).eq('id', risco.id)
    if (error) alert(`Erro ao atualizar: ${error.message}`)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este risco?')) return
    const { error } = await supabase.from('riscos').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setRiscos((prev) => prev.filter((r) => r.id !== id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && (
        <div>
          {!formAberto ? (
            <button
              onClick={() => setFormAberto(true)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              + Mapear risco
            </button>
          ) : (
            <form onSubmit={adicionar} className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição do risco..."
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                value={acaoMitigadora}
                onChange={(e) => setAcaoMitigadora(e.target.value)}
                placeholder="Ação mitigadora..."
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <input
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Responsável"
                  className="min-w-[140px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
                <select
                  value={probabilidade}
                  onChange={(e) => setProbabilidade(e.target.value as NivelRisco | '')}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Probabilidade...</option>
                  {NIVEIS_RISCO.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <select
                  value={impacto}
                  onChange={(e) => setImpacto(e.target.value as NivelRisco | '')}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  <option value="">Impacto em obra...</option>
                  {NIVEIS_RISCO.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={limparForm}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !descricao.trim()}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {riscosOrdenados.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhum risco mapeado ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {riscosOrdenados.map((risco) => {
            const criticidade = calcularCriticidade(risco.probabilidade, risco.impacto)
            return (
              <li
                key={risco.id}
                className={
                  'flex items-start justify-between gap-3 rounded-md border p-3 ' +
                  (risco.mitigado ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-gray-200 bg-white')
                }
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={risco.mitigado ? 'text-sm text-gray-500 line-through' : 'text-sm font-medium text-gray-800'}>
                      {risco.descricao}
                    </p>
                    {criticidade && (
                      <Badge
                        label={`Criticidade: ${criticidade}`}
                        className={CORES_NIVEL_RISCO[criticidade].badge}
                      />
                    )}
                    {risco.mitigado && (
                      <Badge label="Mitigado" className="border-green-300 bg-green-50 text-green-700" />
                    )}
                  </div>
                  {risco.acao_mitigadora && (
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="text-gray-400">Ação mitigadora: </span>
                      {risco.acao_mitigadora}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {risco.probabilidade && <span>Probabilidade: {risco.probabilidade}</span>}
                    {risco.impacto && <span>Impacto em obra: {risco.impacto}</span>}
                    {risco.responsavel && <span>Responsável: {risco.responsavel}</span>}
                    {risco.data_limite && <span>Prazo: {formatarData(risco.data_limite)}</span>}
                  </div>
                </div>
                {isEditor && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => alternarMitigado(risco)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {risco.mitigado ? 'Reabrir' : 'Marcar mitigado'}
                    </button>
                    <button
                      onClick={() => excluir(risco.id)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="Excluir risco"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
