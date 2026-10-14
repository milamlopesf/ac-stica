'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { FluxoModeloEtapa, FluxoProjetoEtapa } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { etapaAtrasada, somarDias } from '@/lib/utils/fluxo'

export function FluxoTrabalhoTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [etapas, setEtapas] = useState<FluxoProjetoEtapa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [iniciando, setIniciando] = useState(false)
  const [erro, setErro] = useState('')
  const hoje = hojeISO()

  useEffect(() => {
    let ativo = true
    supabase
      .from('fluxo_projeto_etapas')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (ativo) {
          setEtapas((data as FluxoProjetoEtapa[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function iniciarFluxo() {
    setErro('')
    setIniciando(true)
    const { data: modelo, error: erroModelo } = await supabase
      .from('fluxo_modelo_etapas')
      .select('*')
      .order('ordem', { ascending: true })
    if (erroModelo) {
      setIniciando(false)
      setErro(`Erro ao carregar molde: ${erroModelo.message}`)
      return
    }
    const etapasModelo = (modelo as FluxoModeloEtapa[]) ?? []
    if (etapasModelo.length === 0) {
      setIniciando(false)
      setErro('Nenhuma etapa cadastrada no molde de fluxo de trabalho ainda. Configure em Painéis.')
      return
    }

    const payload = etapasModelo.map((m, i) => ({
      projeto_id: projetoId,
      nome: m.nome,
      ordem: m.ordem,
      sla_dias: m.sla_dias,
      status: i === 0 ? ('em_andamento' as const) : ('pendente' as const),
      data_inicio: i === 0 ? hoje : null,
      data_limite: i === 0 ? somarDias(hoje, m.sla_dias) : null,
    }))

    const { data, error } = await supabase.from('fluxo_projeto_etapas').insert(payload).select()
    setIniciando(false)
    if (error) {
      setErro(`Erro ao iniciar fluxo: ${error.message}`)
      return
    }
    setEtapas((data as FluxoProjetoEtapa[]).sort((a, b) => a.ordem - b.ordem))
  }

  async function concluirEtapa(etapa: FluxoProjetoEtapa) {
    const { data: concluida, error } = await supabase
      .from('fluxo_projeto_etapas')
      .update({ status: 'concluido', data_conclusao: hoje })
      .eq('id', etapa.id)
      .select()
      .single()
    if (error) {
      alert(`Erro ao concluir etapa: ${error.message}`)
      return
    }

    const proxima = etapas.find((e) => e.ordem > etapa.ordem && e.status === 'pendente')
    let proximaAtualizada: FluxoProjetoEtapa | null = null
    if (proxima) {
      const dataLimite = somarDias(hoje, proxima.sla_dias)
      const { data, error: erroProxima } = await supabase
        .from('fluxo_projeto_etapas')
        .update({ status: 'em_andamento', data_inicio: hoje, data_limite: dataLimite })
        .eq('id', proxima.id)
        .select()
        .single()
      if (erroProxima) {
        alert(`Etapa concluída, mas erro ao ativar a próxima: ${erroProxima.message}`)
      } else {
        proximaAtualizada = data as FluxoProjetoEtapa
      }
    }

    setEtapas((prev) =>
      prev.map((e) => {
        if (e.id === etapa.id) return concluida as FluxoProjetoEtapa
        if (proximaAtualizada && e.id === proximaAtualizada.id) return proximaAtualizada
        return e
      })
    )
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  if (etapas.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">Nenhum fluxo de trabalho iniciado para este projeto.</p>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {isEditor && (
          <button
            onClick={iniciarFluxo}
            disabled={iniciando}
            className="self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {iniciando ? 'Iniciando...' : 'Iniciar fluxo de trabalho'}
          </button>
        )}
      </div>
    )
  }

  const concluidas = etapas.filter((e) => e.status === 'concluido').length

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        {concluidas} de {etapas.length} etapas concluídas
      </p>

      <ul className="flex flex-col divide-y divide-gray-100">
        {etapas.map((etapa, i) => {
          const atrasada = etapaAtrasada(etapa, hoje)
          return (
            <li key={etapa.id} className="flex items-start justify-between gap-3 py-3">
              <div className="flex items-start gap-3">
                <span
                  className={clsx(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    etapa.status === 'concluido' && 'bg-green-100 text-green-700',
                    etapa.status === 'em_andamento' && (atrasada ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'),
                    etapa.status === 'pendente' && 'bg-gray-100 text-gray-400'
                  )}
                >
                  {etapa.status === 'concluido' ? '✓' : i + 1}
                </span>
                <div>
                  <p
                    className={clsx(
                      'font-medium',
                      etapa.status === 'pendente' ? 'text-gray-400' : 'text-gray-900'
                    )}
                  >
                    {etapa.nome}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    SLA: {etapa.sla_dias} {etapa.sla_dias === 1 ? 'dia' : 'dias'}
                    {etapa.status === 'concluido' && etapa.data_conclusao && (
                      <> · concluída em {formatarData(etapa.data_conclusao)}</>
                    )}
                    {etapa.status === 'em_andamento' && etapa.data_limite && (
                      <> · prazo: {formatarData(etapa.data_limite)}</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {atrasada && (
                  <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    Atrasado
                  </span>
                )}
                {etapa.status === 'em_andamento' && isEditor && (
                  <button
                    onClick={() => concluirEtapa(etapa)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Concluir etapa
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
