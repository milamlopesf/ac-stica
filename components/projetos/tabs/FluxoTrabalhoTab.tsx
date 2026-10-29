'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { FluxoInstancia, FluxoModelo, FluxoModeloEtapa, FluxoProjetoEtapa } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { fluxoAtrasado, somarDias } from '@/lib/utils/fluxo'

export function FluxoTrabalhoTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [instancias, setInstancias] = useState<FluxoInstancia[]>([])
  const [etapas, setEtapas] = useState<FluxoProjetoEtapa[]>([])
  const [tipos, setTipos] = useState<FluxoModelo[]>([])
  const [tipoSelecionadoId, setTipoSelecionadoId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [iniciando, setIniciando] = useState(false)
  const [agendando, setAgendando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false)
  const [erro, setErro] = useState('')
  const hoje = hojeISO()
  const [dataAgendamento, setDataAgendamento] = useState(hoje)

  async function talvezAtivarPrimeiraEtapa(
    instancia: FluxoInstancia,
    etapasDaInstancia: FluxoProjetoEtapa[]
  ): Promise<FluxoProjetoEtapa[]> {
    const primeira = etapasDaInstancia[0]
    const deveAtivar =
      isEditor &&
      etapasDaInstancia.length > 0 &&
      etapasDaInstancia.every((et) => et.status === 'pendente') &&
      Boolean(instancia.data_inicio_agendada) &&
      instancia.data_inicio_agendada! <= hoje
    if (!deveAtivar) return etapasDaInstancia
    const { data: ativada } = await supabase
      .from('fluxo_projeto_etapas')
      .update({ status: 'em_andamento', data_inicio: instancia.data_inicio_agendada })
      .eq('id', primeira.id)
      .select()
      .single()
    if (!ativada) return etapasDaInstancia
    return etapasDaInstancia.map((et) => (et.id === primeira.id ? (ativada as FluxoProjetoEtapa) : et))
  }

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase
        .from('fluxo_instancias')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: true }),
      supabase
        .from('fluxo_projeto_etapas')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('ordem', { ascending: true }),
      supabase.from('fluxo_modelos').select('*').order('created_at', { ascending: true }),
    ]).then(async ([{ data: inst }, { data: et }, { data: m }]) => {
      if (!ativo) return
      const listaInstancias = (inst as FluxoInstancia[]) ?? []
      let listaEtapas = (et as FluxoProjetoEtapa[]) ?? []
      const listaTipos = (m as FluxoModelo[]) ?? []
      setTipos(listaTipos)
      setTipoSelecionadoId((atual) => atual || listaTipos[0]?.id || '')

      for (const instancia of listaInstancias) {
        const etapasDaInstancia = listaEtapas.filter((e) => e.instancia_id === instancia.id)
        const atualizadas = await talvezAtivarPrimeiraEtapa(instancia, etapasDaInstancia)
        listaEtapas = listaEtapas.map((e) => atualizadas.find((a) => a.id === e.id) ?? e)
      }

      if (!ativo) return
      setInstancias(listaInstancias)
      setEtapas(listaEtapas)
      setMostrarFormNovo(listaInstancias.length === 0)
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projetoId, supabase])

  async function carregarMoldeDoTipo() {
    const tipoSelecionado = tipos.find((t) => t.id === tipoSelecionadoId)
    if (!tipoSelecionado) {
      setErro('Nenhum tipo de fluxo cadastrado ainda. Configure em Painéis.')
      return null
    }
    const { data: modelo, error: erroModelo } = await supabase
      .from('fluxo_modelo_etapas')
      .select('*')
      .eq('modelo_id', tipoSelecionadoId)
      .order('ordem', { ascending: true })
    if (erroModelo) {
      setErro(`Erro ao carregar molde: ${erroModelo.message}`)
      return null
    }
    const etapasModelo = (modelo as FluxoModeloEtapa[]) ?? []
    if (etapasModelo.length === 0) {
      setErro('Este tipo de fluxo ainda não tem etapas cadastradas. Configure em Painéis.')
      return null
    }
    return { tipoSelecionado, etapasModelo }
  }

  async function iniciarFluxo() {
    setErro('')
    setIniciando(true)
    const molde = await carregarMoldeDoTipo()
    if (!molde) {
      setIniciando(false)
      return
    }
    const { tipoSelecionado, etapasModelo } = molde

    const dataLimiteTotal = somarDias(hoje, tipoSelecionado.sla_dias)
    const { data: novaInstancia, error: erroInstancia } = await supabase
      .from('fluxo_instancias')
      .insert({
        projeto_id: projetoId,
        modelo_id: tipoSelecionadoId,
        nome: tipoSelecionado.nome,
        sla_dias_total: tipoSelecionado.sla_dias,
        data_limite_total: dataLimiteTotal,
      })
      .select()
      .single()
    if (erroInstancia || !novaInstancia) {
      setIniciando(false)
      setErro(`Erro ao iniciar fluxo: ${erroInstancia?.message}`)
      return
    }
    const instancia = novaInstancia as FluxoInstancia

    const payload = etapasModelo.map((m, i) => ({
      instancia_id: instancia.id,
      projeto_id: projetoId,
      nome: m.nome,
      ordem: m.ordem,
      status: i === 0 ? ('em_andamento' as const) : ('pendente' as const),
      data_inicio: i === 0 ? hoje : null,
    }))

    const { data, error } = await supabase.from('fluxo_projeto_etapas').insert(payload).select()
    setIniciando(false)
    if (error) {
      setErro(`Erro ao iniciar fluxo: ${error.message}`)
      await supabase.from('fluxo_instancias').delete().eq('id', instancia.id)
      return
    }
    setInstancias((prev) => [...prev, instancia])
    setEtapas((prev) => [...prev, ...(data as FluxoProjetoEtapa[]).sort((a, b) => a.ordem - b.ordem)])
    setMostrarFormNovo(false)
  }

  async function agendarFluxo() {
    if (!dataAgendamento) {
      setErro('Escolha uma data para o início do fluxo.')
      return
    }
    setErro('')
    setAgendando(true)
    const molde = await carregarMoldeDoTipo()
    if (!molde) {
      setAgendando(false)
      return
    }
    const { tipoSelecionado, etapasModelo } = molde

    const dataLimiteTotal = somarDias(dataAgendamento, tipoSelecionado.sla_dias)
    const { data: novaInstancia, error: erroInstancia } = await supabase
      .from('fluxo_instancias')
      .insert({
        projeto_id: projetoId,
        modelo_id: tipoSelecionadoId,
        nome: tipoSelecionado.nome,
        sla_dias_total: tipoSelecionado.sla_dias,
        data_limite_total: dataLimiteTotal,
        data_inicio_agendada: dataAgendamento,
      })
      .select()
      .single()
    if (erroInstancia || !novaInstancia) {
      setAgendando(false)
      setErro(`Erro ao agendar fluxo: ${erroInstancia?.message}`)
      return
    }
    const instancia = novaInstancia as FluxoInstancia

    const payload = etapasModelo.map((m) => ({
      instancia_id: instancia.id,
      projeto_id: projetoId,
      nome: m.nome,
      ordem: m.ordem,
      status: 'pendente' as const,
      data_inicio: null,
    }))

    const { data, error } = await supabase.from('fluxo_projeto_etapas').insert(payload).select()
    if (error) {
      setAgendando(false)
      setErro(`Erro ao agendar fluxo: ${error.message}`)
      await supabase.from('fluxo_instancias').delete().eq('id', instancia.id)
      return
    }
    const inseridas = (data as FluxoProjetoEtapa[]).sort((a, b) => a.ordem - b.ordem)
    const etapasFinal = await talvezAtivarPrimeiraEtapa(instancia, inseridas)
    setAgendando(false)
    setInstancias((prev) => [...prev, instancia])
    setEtapas((prev) => [...prev, ...etapasFinal])
    setMostrarFormNovo(false)
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

    const proxima = etapas.find(
      (e) => e.instancia_id === etapa.instancia_id && e.ordem > etapa.ordem && e.status === 'pendente'
    )
    let proximaAtualizada: FluxoProjetoEtapa | null = null
    if (proxima) {
      const { data, error: erroProxima } = await supabase
        .from('fluxo_projeto_etapas')
        .update({ status: 'em_andamento', data_inicio: hoje })
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

  async function editarDataConclusao(etapa: FluxoProjetoEtapa, novaData: string) {
    if (!novaData || novaData === etapa.data_conclusao) return
    const anterior = etapas
    setEtapas((prev) => prev.map((e) => (e.id === etapa.id ? { ...e, data_conclusao: novaData } : e)))
    const { error } = await supabase
      .from('fluxo_projeto_etapas')
      .update({ data_conclusao: novaData })
      .eq('id', etapa.id)
    if (error) {
      alert(`Erro ao corrigir data: ${error.message}`)
      setEtapas(anterior)
    }
  }

  async function renomearInstancia(instancia: FluxoInstancia, novoNome: string) {
    const nome = novoNome.trim()
    if (!nome || nome === instancia.nome) return
    const anterior = instancias
    setInstancias((prev) => prev.map((i) => (i.id === instancia.id ? { ...i, nome } : i)))
    const { error } = await supabase.from('fluxo_instancias').update({ nome }).eq('id', instancia.id)
    if (error) {
      alert(`Erro ao renomear: ${error.message}`)
      setInstancias(anterior)
    }
  }

  async function excluirFluxo(instancia: FluxoInstancia, aindaAgendado: boolean) {
    const mensagem = aindaAgendado
      ? 'Cancelar o agendamento deste fluxo de trabalho?'
      : 'Apagar este fluxo de trabalho? Todo o progresso registrado será perdido.'
    if (!confirm(mensagem)) return
    setExcluindoId(instancia.id)
    const { error } = await supabase.from('fluxo_instancias').delete().eq('id', instancia.id)
    setExcluindoId(null)
    if (error) {
      alert(`Erro ao apagar fluxo: ${error.message}`)
      return
    }
    setInstancias((prev) => prev.filter((i) => i.id !== instancia.id))
    setEtapas((prev) => prev.filter((e) => e.instancia_id !== instancia.id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        {instancias.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum fluxo de trabalho iniciado para este projeto.</p>
        ) : (
          <span />
        )}
        {isEditor && !mostrarFormNovo && (
          <button
            onClick={() => setMostrarFormNovo(true)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            + Novo fluxo
          </button>
        )}
      </div>

      {isEditor && mostrarFormNovo && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {tipos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum tipo de fluxo cadastrado ainda. Configure em Painéis.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Tipo de fluxo</label>
                <select
                  value={tipoSelecionadoId}
                  onChange={(e) => setTipoSelecionadoId(e.target.value)}
                  className="w-fit rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.sla_dias} {t.sla_dias === 1 ? 'dia' : 'dias'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <button
                  onClick={iniciarFluxo}
                  disabled={iniciando || agendando}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {iniciando ? 'Iniciando...' : 'Iniciar fluxo de trabalho'}
                </button>
                <span className="pb-2 text-sm text-gray-400">ou</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Agendar início para</label>
                  <input
                    type="date"
                    min={hoje}
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <button
                  onClick={agendarFluxo}
                  disabled={iniciando || agendando}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {agendando ? 'Agendando...' : 'Agendar início do fluxo'}
                </button>
              </div>
            </>
          )}
          {instancias.length > 0 && (
            <button
              onClick={() => {
                setMostrarFormNovo(false)
                setErro('')
              }}
              className="w-fit text-sm text-gray-500 hover:underline"
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {[...instancias]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((instancia) => {
        const etapasDaInstancia = etapas
          .filter((e) => e.instancia_id === instancia.id)
          .sort((a, b) => a.ordem - b.ordem)
        const todasPendentes = etapasDaInstancia.every((e) => e.status === 'pendente')
        const aindaAgendado = todasPendentes && Boolean(instancia.data_inicio_agendada)

        if (aindaAgendado) {
          return (
            <div key={instancia.id} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
                  {isEditor ? (
                    <input
                      key={instancia.id}
                      defaultValue={instancia.nome}
                      onBlur={(e) => renomearInstancia(instancia, e.target.value)}
                      className="min-w-[10rem] rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-gray-700 hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none"
                    />
                  ) : (
                    <span className="font-medium text-gray-700">{instancia.nome}</span>
                  )}
                  <span>· agendado para iniciar em {formatarData(instancia.data_inicio_agendada)}</span>
                </div>
                {isEditor && (
                  <button
                    onClick={() => excluirFluxo(instancia, true)}
                    disabled={excluindoId === instancia.id}
                    className="text-sm text-red-600 hover:underline disabled:opacity-60"
                  >
                    {excluindoId === instancia.id ? 'Cancelando...' : 'Cancelar agendamento'}
                  </button>
                )}
              </div>
              <ul className="flex flex-col divide-y divide-gray-100">
                {etapasDaInstancia.map((etapa, i) => (
                  <li key={etapa.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-400">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-400">{etapa.nome}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        const concluidas = etapasDaInstancia.filter((e) => e.status === 'concluido').length
        const atrasado = fluxoAtrasado(instancia, etapasDaInstancia, hoje)

        return (
          <div key={instancia.id} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                {isEditor ? (
                  <input
                    key={instancia.id}
                    defaultValue={instancia.nome}
                    onBlur={(e) => renomearInstancia(instancia, e.target.value)}
                    className="min-w-[10rem] rounded border border-transparent bg-transparent px-1 py-0.5 font-medium text-gray-700 hover:border-gray-300 focus:border-blue-400 focus:bg-white focus:outline-none"
                  />
                ) : (
                  <span className="font-medium text-gray-700">{instancia.nome}</span>
                )}
                <span>
                  {concluidas} de {etapasDaInstancia.length} etapas concluídas
                  {instancia.data_limite_total && <> · prazo total: {formatarData(instancia.data_limite_total)}</>}
                </span>
                {atrasado && (
                  <span className="rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                    Atrasado
                  </span>
                )}
              </div>
              {isEditor && (
                <button
                  onClick={() => excluirFluxo(instancia, false)}
                  disabled={excluindoId === instancia.id}
                  className="shrink-0 text-sm text-red-600 hover:underline disabled:opacity-60"
                >
                  {excluindoId === instancia.id ? 'Apagando...' : 'Apagar fluxo'}
                </button>
              )}
            </div>

            <ul className="flex flex-col divide-y divide-gray-100">
              {etapasDaInstancia.map((etapa) => (
                <li key={etapa.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={etapa.status === 'concluido'}
                      disabled={etapa.status !== 'em_andamento' || !isEditor}
                      onChange={() => concluirEtapa(etapa)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 disabled:opacity-60"
                    />
                    <div>
                      <p
                        className={clsx(
                          'font-medium',
                          etapa.status === 'pendente' ? 'text-gray-400' : 'text-gray-900'
                        )}
                      >
                        {etapa.nome}
                      </p>
                      {etapa.status === 'concluido' && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <span>concluída em</span>
                          <input
                            type="date"
                            value={etapa.data_conclusao ?? ''}
                            disabled={!isEditor}
                            onChange={(e) => editarDataConclusao(etapa, e.target.value)}
                            className="rounded border border-gray-200 px-1.5 py-0.5 text-xs disabled:border-transparent disabled:bg-transparent disabled:px-0"
                          />
                        </div>
                      )}
                      {etapa.status === 'em_andamento' && etapa.data_inicio && (
                        <p className="mt-0.5 text-xs text-gray-500">iniciada em {formatarData(etapa.data_inicio)}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
