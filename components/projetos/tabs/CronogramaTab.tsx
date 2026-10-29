'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CronogramaEtapa, EtapaCronograma } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { ETAPAS_CRONOGRAMA } from '@/lib/utils/cores'
import { proximaEntregaPendente } from '@/lib/utils/cronograma'

type StatusBarra = 'concluido_prazo' | 'concluido_atraso' | 'atrasado' | 'planejado'

const COR_STATUS: Record<StatusBarra, string> = {
  concluido_prazo: '#22c55e',
  concluido_atraso: '#f59e0b',
  atrasado: '#ef4444',
  planejado: '#94a3b8',
}

const LABEL_STATUS: Record<StatusBarra, string> = {
  concluido_prazo: 'Concluída no prazo',
  concluido_atraso: 'Concluída em atraso',
  atrasado: 'Atrasada',
  planejado: 'Planejada',
}

function menorData(...datas: (string | null)[]): string | null {
  const validas = datas.filter((d): d is string => Boolean(d)).sort()
  return validas[0] ?? null
}

function maiorData(...datas: (string | null)[]): string | null {
  const validas = datas.filter((d): d is string => Boolean(d)).sort()
  return validas[validas.length - 1] ?? null
}

function calcularBarra(etapa: CronogramaEtapa, hoje: string) {
  const inicio = etapa.data_inicio ?? etapa.data_fim
  const fim = etapa.data_fim ?? etapa.data_inicio

  if (!inicio || !fim) return null

  let status: StatusBarra = 'planejado'
  if (etapa.concluido) {
    status =
      etapa.data_fim && etapa.data_conclusao && etapa.data_conclusao > etapa.data_fim
        ? 'concluido_atraso'
        : 'concluido_prazo'
  } else if (etapa.data_fim && etapa.data_fim < hoje) {
    status = 'atrasado'
  }

  return { inicio, fim: fim < inicio ? inicio : fim, status }
}

function IconeStatus({ status }: { status: StatusBarra }) {
  if (status === 'planejado') {
    return <span className="block h-1.5 w-1.5 rounded-full bg-gray-300" />
  }
  if (status === 'atrasado') {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold leading-none text-red-500">
        !
      </span>
    )
  }
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" style={{ color: COR_STATUS[status] }}>
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M6 10.2l2.4 2.4L14 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function mesesEntre(inicioIso: string, fimIso: string) {
  const meses: { iso: string; label: string }[] = []
  const [anoI, mesI] = inicioIso.split('-').map(Number)
  const [anoF, mesF] = fimIso.split('-').map(Number)
  let ano = anoI
  let mes = mesI
  while (ano < anoF || (ano === anoF && mes <= mesF)) {
    const iso = `${ano}-${String(mes).padStart(2, '0')}-01`
    const label = new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit',
    })
    meses.push({ iso, label })
    mes += 1
    if (mes > 12) {
      mes = 1
      ano += 1
    }
  }
  return meses
}

export function CronogramaTab({
  projetoId,
  isEditor,
  onEntregaAtualizada,
}: {
  projetoId: string
  isEditor: boolean
  onEntregaAtualizada?: (novaEntrega: string) => void
}) {
  const supabase = createClient()
  const [etapas, setEtapas] = useState<CronogramaEtapa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [fase, setFase] = useState('Única')
  const [etapa, setEtapa] = useState<EtapaCronograma>(ETAPAS_CRONOGRAMA[0])
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const hoje = hojeISO()

  useEffect(() => {
    let ativo = true
    supabase
      .from('cronograma_etapas')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('fase', { ascending: true })
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (ativo) {
          setEtapas((data as CronogramaEtapa[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  function limparForm() {
    setFase('Única')
    setEtapa(ETAPAS_CRONOGRAMA[0])
    setDataInicio('')
    setDataFim('')
    setMostrarForm(false)
  }

  async function sincronizarEntrega(novasEtapas: CronogramaEtapa[]) {
    const proxima = proximaEntregaPendente(novasEtapas)
    if (!proxima) return
    const { error } = await supabase.from('projetos').update({ entrega: proxima }).eq('id', projetoId)
    if (!error) onEntregaAtualizada?.(proxima)
  }

  async function adicionarEtapa(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const ordem = etapas.filter((x) => x.fase === fase).length
    const { data, error } = await supabase
      .from('cronograma_etapas')
      .insert({
        projeto_id: projetoId,
        fase: fase.trim() || 'Única',
        etapa,
        ordem,
        data_inicio: dataInicio || null,
        data_fim: dataFim || null,
      })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      setErro(`Erro ao adicionar etapa: ${error.message}`)
      return
    }
    const novasEtapas = [...etapas, data as CronogramaEtapa]
    setEtapas(novasEtapas)
    limparForm()
    sincronizarEntrega(novasEtapas)
  }

  async function excluirEtapa(id: string) {
    if (!confirm('Remover esta etapa do cronograma?')) return
    const { error } = await supabase.from('cronograma_etapas').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    const novasEtapas = etapas.filter((e) => e.id !== id)
    setEtapas(novasEtapas)
    sincronizarEntrega(novasEtapas)
  }

  async function alternarConcluido(etapaAlvo: CronogramaEtapa) {
    const payload = { concluido: !etapaAlvo.concluido, data_conclusao: !etapaAlvo.concluido ? hoje : null }
    const anterior = etapas
    const novasEtapas = etapas.map((e) => (e.id === etapaAlvo.id ? { ...e, ...payload } : e))
    setEtapas(novasEtapas)
    const { error } = await supabase.from('cronograma_etapas').update(payload).eq('id', etapaAlvo.id)
    if (error) {
      alert(`Erro ao atualizar: ${error.message}`)
      setEtapas(anterior)
      return
    }
    sincronizarEntrega(novasEtapas)
  }

  async function editarDataConclusao(etapaAlvo: CronogramaEtapa, novaData: string) {
    if (!novaData || novaData === etapaAlvo.data_conclusao) return
    const anterior = etapas
    setEtapas((prev) => prev.map((e) => (e.id === etapaAlvo.id ? { ...e, data_conclusao: novaData } : e)))
    const { error } = await supabase
      .from('cronograma_etapas')
      .update({ data_conclusao: novaData })
      .eq('id', etapaAlvo.id)
    if (error) {
      alert(`Erro ao corrigir data: ${error.message}`)
      setEtapas(anterior)
    }
  }

  const { fases, limiteInicio, limiteFim } = useMemo(() => {
    const porFase = new Map<string, CronogramaEtapa[]>()
    let inicio: string | null = null
    let fim: string | null = null

    for (const e of etapas) {
      if (!porFase.has(e.fase)) porFase.set(e.fase, [])
      porFase.get(e.fase)!.push(e)

      const b = calcularBarra(e, hoje)
      if (b) {
        inicio = menorData(inicio, b.inicio)
        fim = maiorData(fim, b.fim)
      }
    }

    inicio = menorData(inicio, hoje)
    fim = maiorData(fim, hoje)

    return { fases: Array.from(porFase.entries()), limiteInicio: inicio, limiteFim: fim }
  }, [etapas, hoje])

  const formAdicionar = isEditor && (
    <div className="flex flex-col gap-2">
      {!mostrarForm ? (
        <button
          onClick={() => setMostrarForm(true)}
          className="self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Adicionar etapa manualmente
        </button>
      ) : (
        <form
          onSubmit={adicionarEtapa}
          className="flex flex-col gap-2 rounded-md border border-gray-200 p-3"
        >
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Fase</label>
              <input
                value={fase}
                onChange={(e) => setFase(e.target.value)}
                placeholder="Única"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Etapa</label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value as EtapaCronograma)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {ETAPAS_CRONOGRAMA.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Data inicial</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Data final</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
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
              disabled={enviando}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </form>
      )}
    </div>
  )

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  if (etapas.length === 0 || !limiteInicio || !limiteFim) {
    return (
      <div className="flex flex-col gap-4">
        {formAdicionar}
        <p className="py-6 text-center text-sm text-gray-500">
          Nenhum cronograma importado para este projeto ainda.
        </p>
      </div>
    )
  }

  const inicioMs = new Date(limiteInicio).getTime()
  const fimMs = new Date(limiteFim).getTime()
  const spanMs = Math.max(fimMs - inicioMs, 1)

  function pct(iso: string) {
    const v = ((new Date(iso).getTime() - inicioMs) / spanMs) * 100
    return Math.min(100, Math.max(0, v))
  }

  const meses = mesesEntre(limiteInicio, limiteFim)
  const pctHoje = pct(hoje)
  const faixasMes = meses.map((m, i) => ({
    ...m,
    inicioPct: pct(m.iso),
    fimPct: i + 1 < meses.length ? pct(meses[i + 1].iso) : 100,
  }))

  return (
    <div className="flex flex-col gap-5">
      {formAdicionar}

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {(Object.keys(LABEL_STATUS) as StatusBarra[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_STATUS[s] }} />
            {LABEL_STATUS[s]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-px bg-teal-400" />
          Hoje ({formatarData(hoje)})
        </span>
      </div>

      {fases.map(([nomeFase, etapasFase]) => (
        <div key={nomeFase} className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-gray-500">{nomeFase}</p>

          <div className="relative">
            {/* grade vertical de meses, cobrindo cabeçalho + linhas */}
            <div className="pointer-events-none absolute inset-0 ml-24 mr-6">
              {faixasMes.map((m, i) => (
                <div
                  key={m.iso}
                  className={`absolute inset-y-0 border-l border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/60' : ''}`}
                  style={{ left: `${m.inicioPct}%`, width: `${Math.max(m.fimPct - m.inicioPct, 0)}%` }}
                />
              ))}
            </div>

            <div className="relative mb-1.5 ml-24 mr-6 flex h-6 items-center rounded-sm bg-slate-100 text-[11px] font-medium text-slate-500">
              {faixasMes.map((m) => (
                <span
                  key={m.iso}
                  className="absolute -translate-x-1/2 capitalize"
                  style={{ left: `${(m.inicioPct + m.fimPct) / 2}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="relative flex flex-col gap-2">
              {etapasFase.map((e) => {
                const barra = calcularBarra(e, hoje)
                const meio = barra ? (pct(barra.inicio) + pct(barra.fim)) / 2 : 0
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={e.concluido}
                      disabled={!isEditor}
                      onChange={() => alternarConcluido(e)}
                      title="Concluída?"
                      className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 disabled:opacity-60"
                    />
                    <span className="w-20 shrink-0 truncate text-xs font-medium text-gray-600" title={e.etapa}>
                      {e.etapa}
                    </span>
                    <div className="flex-1">
                      <div className="relative h-4">
                        {pctHoje >= 0 && pctHoje <= 100 && (
                          <div
                            className="absolute -top-1 -bottom-1 w-px bg-teal-400"
                            style={{ left: `${pctHoje}%` }}
                          />
                        )}
                        {barra && (
                          <>
                            <div
                              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full"
                              style={{
                                left: `${pct(barra.inicio)}%`,
                                width: `${Math.max(pct(barra.fim) - pct(barra.inicio), 0.5)}%`,
                                backgroundColor: COR_STATUS[barra.status],
                              }}
                            />
                            <div
                              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                              style={{ left: `${pct(barra.inicio)}%`, backgroundColor: COR_STATUS[barra.status] }}
                            />
                            <div
                              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                              style={{ left: `${pct(barra.fim)}%`, backgroundColor: COR_STATUS[barra.status] }}
                            />
                          </>
                        )}
                      </div>
                      {barra && (
                        <div
                          className="relative h-3.5 text-[10px] font-medium leading-none"
                          style={{ color: COR_STATUS[barra.status] }}
                          title={[
                            LABEL_STATUS[barra.status],
                            e.data_inicio && `Data inicial: ${formatarData(e.data_inicio)}`,
                            e.data_fim && `Data final: ${formatarData(e.data_fim)}`,
                            e.concluido && e.data_conclusao && `Concluída em: ${formatarData(e.data_conclusao)}`,
                          ]
                            .filter(Boolean)
                            .join('\n')}
                        >
                          <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${meio}%` }}>
                            {formatarData(barra.inicio)} – {formatarData(barra.fim)}
                          </span>
                        </div>
                      )}
                    </div>
                    {e.concluido && (
                      <input
                        type="date"
                        value={e.data_conclusao ?? ''}
                        disabled={!isEditor}
                        onChange={(ev) => editarDataConclusao(e, ev.target.value)}
                        title="Concluída em"
                        className="w-32 shrink-0 rounded border border-gray-200 px-1.5 py-0.5 text-[11px] disabled:border-transparent disabled:bg-transparent"
                      />
                    )}
                    <span className="w-4 shrink-0">
                      {barra && <IconeStatus status={barra.status} />}
                    </span>
                    {isEditor && (
                      <button
                        onClick={() => excluirEtapa(e.id)}
                        className="shrink-0 text-gray-300 hover:text-red-600"
                        aria-label={`Remover etapa ${e.etapa}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
