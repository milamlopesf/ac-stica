'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { FluxoModelo, FluxoModeloEtapa } from '@/lib/types/database'

export function FluxoModeloSection() {
  const supabase = createClient()
  const [modelos, setModelos] = useState<FluxoModelo[]>([])
  const [etapas, setEtapas] = useState<FluxoModeloEtapa[]>([])
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [nomeEtapa, setNomeEtapa] = useState('')
  const [novoTipoNome, setNovoTipoNome] = useState('')
  const [novoTipoSla, setNovoTipoSla] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('fluxo_modelos').select('*').order('created_at', { ascending: true }),
      supabase.from('fluxo_modelo_etapas').select('*').order('ordem', { ascending: true }),
    ]).then(([{ data: m }, { data: e }]) => {
      if (!ativo) return
      const listaModelos = (m as FluxoModelo[]) ?? []
      setModelos(listaModelos)
      setEtapas((e as FluxoModeloEtapa[]) ?? [])
      setModeloSelecionadoId((atual) => atual ?? listaModelos[0]?.id ?? null)
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const modeloSelecionado = modelos.find((m) => m.id === modeloSelecionadoId) ?? null

  const etapasDoTipo = etapas
    .filter((e) => e.modelo_id === modeloSelecionadoId)
    .sort((a, b) => a.ordem - b.ordem)

  async function criarTipo(e: React.FormEvent) {
    e.preventDefault()
    const sla = parseInt(novoTipoSla, 10)
    if (!novoTipoNome.trim() || !(sla > 0)) return
    setErro('')
    setEnviando(true)
    const { data, error } = await supabase
      .from('fluxo_modelos')
      .insert({ nome: novoTipoNome.trim(), sla_dias: sla })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      setErro(`Erro ao criar tipo de fluxo: ${error.message}`)
      return
    }
    const novo = data as FluxoModelo
    setModelos((prev) => [...prev, novo])
    setModeloSelecionadoId(novo.id)
    setNovoTipoNome('')
    setNovoTipoSla('')
  }

  async function excluirTipo(id: string) {
    if (!confirm('Remover este tipo de fluxo e todas as suas etapas do molde?')) return
    const { error } = await supabase.from('fluxo_modelos').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setModelos((prev) => prev.filter((m) => m.id !== id))
    setEtapas((prev) => prev.filter((e) => e.modelo_id !== id))
    setModeloSelecionadoId((atual) => (atual === id ? null : atual))
  }

  async function atualizarSlaTipo(id: string, novoValor: string) {
    const sla = parseInt(novoValor, 10)
    if (!(sla > 0)) return
    const anterior = modelos
    setModelos((prev) => prev.map((m) => (m.id === id ? { ...m, sla_dias: sla } : m)))
    const { error } = await supabase.from('fluxo_modelos').update({ sla_dias: sla }).eq('id', id)
    if (error) {
      alert(`Erro ao salvar SLA total: ${error.message}`)
      setModelos(anterior)
    }
  }

  async function adicionarEtapa(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeEtapa.trim() || !modeloSelecionadoId) return
    setErro('')
    setEnviando(true)
    const ordem = etapasDoTipo.length ? Math.max(...etapasDoTipo.map((e) => e.ordem)) + 1 : 1
    const { data, error } = await supabase
      .from('fluxo_modelo_etapas')
      .insert({ modelo_id: modeloSelecionadoId, nome: nomeEtapa.trim(), ordem })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      setErro(`Erro ao adicionar etapa: ${error.message}`)
      return
    }
    setEtapas((prev) => [...prev, data as FluxoModeloEtapa])
    setNomeEtapa('')
  }

  async function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= etapasDoTipo.length) return
    const a = etapasDoTipo[index]
    const b = etapasDoTipo[alvo]
    setEtapas((prev) =>
      prev.map((e) => {
        if (e.id === a.id) return { ...e, ordem: b.ordem }
        if (e.id === b.id) return { ...e, ordem: a.ordem }
        return e
      })
    )
    const { error } = await supabase.from('fluxo_modelo_etapas').update({ ordem: a.ordem }).eq('id', b.id)
    const { error: erro2 } = await supabase
      .from('fluxo_modelo_etapas')
      .update({ ordem: b.ordem })
      .eq('id', a.id)
    if (error || erro2) alert(`Erro ao reordenar: ${(error ?? erro2)?.message}`)
  }

  async function excluirEtapa(id: string) {
    if (!confirm('Remover esta etapa do tipo de fluxo?')) return
    const { error } = await supabase.from('fluxo_modelo_etapas').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setEtapas((prev) => prev.filter((e) => e.id !== id))
  }

  if (carregando) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Tipos de fluxo de trabalho</h2>
      <p className="mb-4 text-sm text-gray-500">
        Cada tipo tem sua própria sequência de etapas e um prazo (SLA) único para o fluxo inteiro.
        Alterar aqui não muda fluxos já em andamento em projetos.
      </p>

      {erro && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {modelos.map((m) => (
          <div key={m.id} className="flex items-center">
            <button
              onClick={() => setModeloSelecionadoId(m.id)}
              className={clsx(
                'rounded-l-md border px-3 py-1.5 text-sm font-medium',
                modeloSelecionadoId === m.id
                  ? 'border-blue-300 bg-blue-100 text-blue-700'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              )}
            >
              {m.nome}
            </button>
            <button
              onClick={() => excluirTipo(m.id)}
              className={clsx(
                'rounded-r-md border border-l-0 px-2 py-1.5 text-gray-400 hover:text-red-600',
                modeloSelecionadoId === m.id ? 'border-blue-300' : 'border-gray-300'
              )}
              aria-label={`Remover tipo ${m.nome}`}
            >
              ✕
            </button>
          </div>
        ))}
        <form onSubmit={criarTipo} className="flex items-center gap-1">
          <input
            value={novoTipoNome}
            onChange={(e) => setNovoTipoNome(e.target.value)}
            placeholder="Novo tipo de fluxo"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            min={1}
            value={novoTipoSla}
            onChange={(e) => setNovoTipoSla(e.target.value)}
            placeholder="SLA total (dias)"
            className="w-32 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            + Tipo
          </button>
        </form>
      </div>

      {!modeloSelecionadoId || !modeloSelecionado ? (
        <p className="text-sm text-gray-500">Cadastre um tipo de fluxo acima pra começar.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">SLA total deste fluxo (dias):</label>
            <input
              type="number"
              min={1}
              defaultValue={modeloSelecionado.sla_dias}
              key={modeloSelecionado.id}
              onBlur={(e) => atualizarSlaTipo(modeloSelecionado.id, e.target.value)}
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
            />
          </div>

          {etapasDoTipo.length === 0 ? (
            <p className="mb-4 text-sm text-gray-500">Nenhuma etapa cadastrada neste tipo ainda.</p>
          ) : (
            <ul className="mb-4 flex flex-col divide-y divide-gray-100">
              {etapasDoTipo.map((etapa, i) => (
                <li key={etapa.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex shrink-0 flex-col">
                    <button
                      onClick={() => mover(i, -1)}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      aria-label="Mover para cima"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => mover(i, 1)}
                      disabled={i === etapasDoTipo.length - 1}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      aria-label="Mover para baixo"
                    >
                      ▼
                    </button>
                  </div>
                  <span className="w-6 shrink-0 text-sm text-gray-400">{i + 1}.</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">{etapa.nome}</span>
                  <button
                    onClick={() => excluirEtapa(etapa.id)}
                    className="shrink-0 text-gray-400 hover:text-red-600"
                    aria-label="Remover etapa"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={adicionarEtapa} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Nome da etapa</label>
              <input
                value={nomeEtapa}
                onChange={(e) => setNomeEtapa(e.target.value)}
                placeholder="Ex: Exportar dados"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              + Adicionar etapa
            </button>
          </form>
        </>
      )}
    </div>
  )
}
