'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { FluxoModelo, FluxoModeloEtapa, FluxoProjetoEtapa } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { etapaAtrasada, somarDias } from '@/lib/utils/fluxo'

export function FluxoTrabalhoTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [etapas, setEtapas] = useState<FluxoProjetoEtapa[]>([])
  const [tipos, setTipos] = useState<FluxoModelo[]>([])
  const [tipoSelecionadoId, setTipoSelecionadoId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [iniciando, setIniciando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')
  const hoje = hojeISO()

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase
        .from('fluxo_projeto_etapas')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('ordem', { ascending: true }),
      supabase.from('fluxo_modelos').select('*').order('created_at', { ascending: true }),
    ]).then(([{ data: e }, { data: m }]) => {
      if (!ativo) return
      setEtapas((e as FluxoProjetoEtapa[]) ?? [])
      const listaTipos = (m as FluxoModelo[]) ?? []
      setTipos(listaTipos)
      setTipoSelecionadoId((atual) => atual || listaTipos[0]?.id || '')
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function iniciarFluxo() {
    if (!tipoSelecionadoId) {
      setErro('Nenhum tipo de fluxo cadastrado ainda. Configure em Painéis.')
      return
    }
    setErro('')
    setIniciando(true)
    const { data: modelo, error: erroModelo } = await supabase
      .from('fluxo_modelo_etapas')
      .select('*')
      .eq('modelo_id', tipoSelecionadoId)
      .order('ordem', { ascending: true })
    if (erroModelo) {
      setIniciando(false)
      setErro(`Erro ao carregar molde: ${erroModelo.message}`)
      return
    }
    const etapasModelo = (modelo as FluxoModeloEtapa[]) ?? []
    if (etapasModelo.length === 0) {
      setIniciando(false)
      setErro('Este tipo de fluxo ainda não tem etapas cadastradas. Configure em Painéis.')
      return
    }

    const tipoNome = tipos.find((t) => t.id === tipoSelecionadoId)?.nome ?? null
    const payload = etapasModelo.map((m, i) => ({
      projeto_id: projetoId,
      modelo_id: tipoSelecionadoId,
      modelo_nome: tipoNome,
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

  async function excluirFluxo() {
    if (!confirm('Apagar o fluxo de trabalho deste projeto? Todo o progresso registrado será perdido.')) return
    setExcluindo(true)
    const { error } = await supabase.from('fluxo_projeto_etapas').delete().eq('projeto_id', projetoId)
    setExcluindo(false)
    if (error) {
      alert(`Erro ao apagar fluxo: ${error.message}`)
      return
    }
    setEtapas([])
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  if (etapas.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-500">Nenhum fluxo de trabalho iniciado para este projeto.</p>
        {isEditor && tipos.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum tipo de fluxo cadastrado ainda. Configure em Painéis.
          </p>
        )}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {isEditor && tipos.length > 0 && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Tipo de fluxo</label>
              <select
                value={tipoSelecionadoId}
                onChange={(e) => setTipoSelecionadoId(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={iniciarFluxo}
              disabled={iniciando}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {iniciando ? 'Iniciando...' : 'Iniciar fluxo de trabalho'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const concluidas = etapas.filter((e) => e.status === 'concluido').length
  const tipoAtivoNome = etapas[0]?.modelo_nome

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {tipoAtivoNome && <span className="font-medium text-gray-700">{tipoAtivoNome}</span>}
          {tipoAtivoNome && ' · '}
          {concluidas} de {etapas.length} etapas concluídas
        </p>
        {isEditor && (
          <button
            onClick={excluirFluxo}
            disabled={excluindo}
            className="text-sm text-red-600 hover:underline disabled:opacity-60"
          >
            {excluindo ? 'Apagando...' : 'Apagar fluxo'}
          </button>
        )}
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}

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
