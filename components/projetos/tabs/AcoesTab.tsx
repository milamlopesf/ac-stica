'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Atividade, StatusAtividade } from '@/lib/types/database'
import { CORES_STATUS_ATIVIDADE } from '@/lib/utils/cores'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { Badge } from '@/components/ui/Badge'

const STATUS: StatusAtividade[] = ['pendente', 'andamento', 'concluido']

export function AcoesTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [acoes, setAcoes] = useState<Atividade[]>([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [dataLimite, setDataLimite] = useState('')
  const [enviando, setEnviando] = useState(false)
  const hoje = hojeISO()

  useEffect(() => {
    let ativo = true
    supabase
      .from('atividades')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_vencimento', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setAcoes((data as Atividade[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setEnviando(true)
    const { data, error } = await supabase
      .from('atividades')
      .insert({
        projeto_id: projetoId,
        texto: texto.trim(),
        responsavel: responsavel.trim() || null,
        data_vencimento: dataLimite || null,
        status: 'pendente',
      })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar ação: ${error.message}`)
      return
    }
    setAcoes((prev) =>
      [...prev, data as Atividade].sort((a, b) => {
        if (!a.data_vencimento && !b.data_vencimento) return 0
        if (!a.data_vencimento) return 1
        if (!b.data_vencimento) return -1
        return a.data_vencimento.localeCompare(b.data_vencimento)
      })
    )
    setTexto('')
    setResponsavel('')
    setDataLimite('')
  }

  async function mudarStatus(acao: Atividade, status: StatusAtividade) {
    setAcoes((prev) => prev.map((a) => (a.id === acao.id ? { ...a, status } : a)))
    const { error } = await supabase.from('atividades').update({ status }).eq('id', acao.id)
    if (error) alert(`Erro ao atualizar: ${error.message}`)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta ação?')) return
    const { error } = await supabase.from('atividades').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setAcoes((prev) => prev.filter((a) => a.id !== id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && (
        <form onSubmit={adicionar} className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ação combinada..."
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Responsável"
              className="min-w-[160px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              type="date"
              value={dataLimite}
              onChange={(e) => setDataLimite(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Adicionar
            </button>
          </div>
        </form>
      )}

      {acoes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhuma ação combinada ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {acoes.map((acao) => {
            const atrasada = Boolean(
              acao.data_vencimento && acao.data_vencimento < hoje && acao.status !== 'concluido'
            )
            return (
              <li key={acao.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      acao.status === 'concluido'
                        ? 'text-sm text-gray-400 line-through'
                        : 'text-sm text-gray-800'
                    }
                  >
                    {acao.texto}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    {acao.responsavel && (
                      <span>
                        Responsável: <span className="font-medium text-gray-700">{acao.responsavel}</span>
                      </span>
                    )}
                    {acao.data_vencimento && (
                      <span className={atrasada ? 'font-medium text-red-600' : ''}>
                        Prazo: {formatarData(acao.data_vencimento)}
                        {atrasada && ' (atrasada)'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isEditor ? (
                    <select
                      value={acao.status}
                      onChange={(e) => mudarStatus(acao, e.target.value as StatusAtividade)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {CORES_STATUS_ATIVIDADE[s].label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge
                      label={CORES_STATUS_ATIVIDADE[acao.status].label}
                      className={CORES_STATUS_ATIVIDADE[acao.status].badge}
                    />
                  )}
                  {isEditor && (
                    <button
                      onClick={() => excluir(acao.id)}
                      className="text-gray-400 hover:text-red-600"
                      aria-label="Excluir ação"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
