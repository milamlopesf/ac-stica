'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CronogramaEtapa } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'

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
  const inicio =
    menorData(etapa.aprovacao_planejado, etapa.aprovacao_realizado) ??
    menorData(etapa.publicacao_planejado, etapa.publicacao_realizado)
  const fim =
    maiorData(etapa.publicacao_planejado, etapa.publicacao_realizado) ?? inicio

  if (!inicio || !fim) return null

  let status: StatusBarra = 'planejado'
  if (etapa.publicacao_realizado) {
    status =
      etapa.publicacao_planejado && etapa.publicacao_realizado > etapa.publicacao_planejado
        ? 'concluido_atraso'
        : 'concluido_prazo'
  } else if (etapa.publicacao_planejado && etapa.publicacao_planejado < hoje) {
    status = 'atrasado'
  }

  return { inicio, fim: fim < inicio ? inicio : fim, status }
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

export function CronogramaTab({ projetoId }: { projetoId: string }) {
  const supabase = createClient()
  const [etapas, setEtapas] = useState<CronogramaEtapa[]>([])
  const [carregando, setCarregando] = useState(true)
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

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  if (etapas.length === 0 || !limiteInicio || !limiteFim) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        Nenhum cronograma importado para este projeto ainda.
      </p>
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {(Object.keys(LABEL_STATUS) as StatusBarra[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_STATUS[s] }} />
            {LABEL_STATUS[s]}
          </span>
        ))}
      </div>

      {fases.map(([nomeFase, etapasFase]) => (
        <div key={nomeFase} className="flex flex-col gap-2">
          {fases.length > 1 && (
            <h4 className="text-sm font-semibold text-gray-800">{nomeFase}</h4>
          )}

          <div className="relative">
            <div className="relative mb-1 ml-28 h-4 border-b border-gray-200 text-[10px] text-gray-400">
              {meses.map((m) => (
                <span
                  key={m.iso}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${pct(m.iso)}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              {etapasFase.map((e) => {
                const barra = calcularBarra(e, hoje)
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <span className="w-28 shrink-0 truncate text-xs font-medium text-gray-600" title={e.etapa}>
                      {e.etapa}
                    </span>
                    <div className="relative h-5 flex-1 rounded bg-gray-100">
                      {pctHoje >= 0 && pctHoje <= 100 && (
                        <div
                          className="absolute top-0 h-5 w-px bg-teal-400"
                          style={{ left: `${pctHoje}%` }}
                        />
                      )}
                      {barra && (
                        <div
                          className="absolute top-0.5 h-4 rounded-sm"
                          style={{
                            left: `${pct(barra.inicio)}%`,
                            width: `${Math.max(pct(barra.fim) - pct(barra.inicio), 1.2)}%`,
                            backgroundColor: COR_STATUS[barra.status],
                          }}
                          title={[
                            LABEL_STATUS[barra.status],
                            e.aprovacao_planejado && `Aprovação planejada: ${formatarData(e.aprovacao_planejado)}`,
                            e.aprovacao_realizado && `Aprovação realizada: ${formatarData(e.aprovacao_realizado)}`,
                            e.publicacao_planejado && `Publicação planejada: ${formatarData(e.publicacao_planejado)}`,
                            e.publicacao_realizado && `Publicação realizada: ${formatarData(e.publicacao_realizado)}`,
                          ]
                            .filter(Boolean)
                            .join('\n')}
                        />
                      )}
                    </div>
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
