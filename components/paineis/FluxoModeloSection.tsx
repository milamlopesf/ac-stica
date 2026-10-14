'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FluxoModeloEtapa } from '@/lib/types/database'

export function FluxoModeloSection() {
  const supabase = createClient()
  const [etapas, setEtapas] = useState<FluxoModeloEtapa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [slaDias, setSlaDias] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    supabase
      .from('fluxo_modelo_etapas')
      .select('*')
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (ativo) {
          setEtapas((data as FluxoModeloEtapa[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    const sla = parseInt(slaDias, 10)
    if (!nome.trim() || !(sla > 0)) return
    setErro('')
    setEnviando(true)
    const ordem = etapas.length ? Math.max(...etapas.map((e) => e.ordem)) + 1 : 1
    const { data, error } = await supabase
      .from('fluxo_modelo_etapas')
      .insert({ nome: nome.trim(), ordem, sla_dias: sla })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      setErro(`Erro ao adicionar etapa: ${error.message}`)
      return
    }
    setEtapas((prev) => [...prev, data as FluxoModeloEtapa])
    setNome('')
    setSlaDias('')
  }

  async function atualizarSla(id: string, novoValor: string) {
    const sla = parseInt(novoValor, 10)
    if (!(sla > 0)) return
    const anterior = etapas
    setEtapas((prev) => prev.map((e) => (e.id === id ? { ...e, sla_dias: sla } : e)))
    const { error } = await supabase.from('fluxo_modelo_etapas').update({ sla_dias: sla }).eq('id', id)
    if (error) {
      alert(`Erro ao salvar SLA: ${error.message}`)
      setEtapas(anterior)
    }
  }

  async function mover(index: number, direcao: -1 | 1) {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= etapas.length) return
    const a = etapas[index]
    const b = etapas[alvo]
    const nova = [...etapas]
    nova[index] = { ...b, ordem: a.ordem }
    nova[alvo] = { ...a, ordem: b.ordem }
    nova.sort((x, y) => x.ordem - y.ordem)
    setEtapas(nova)
    const { error } = await supabase
      .from('fluxo_modelo_etapas')
      .update({ ordem: a.ordem })
      .eq('id', b.id)
    const { error: erro2 } = await supabase
      .from('fluxo_modelo_etapas')
      .update({ ordem: b.ordem })
      .eq('id', a.id)
    if (error || erro2) alert(`Erro ao reordenar: ${(error ?? erro2)?.message}`)
  }

  async function excluir(id: string) {
    if (!confirm('Remover esta etapa do molde de fluxo de trabalho?')) return
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
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Molde do fluxo de trabalho</h2>
      <p className="mb-4 text-sm text-gray-500">
        Sequência padrão de etapas (com prazo em dias) que um projeto segue ao iniciar o fluxo de
        trabalho. Alterar aqui não muda fluxos já em andamento em projetos.
      </p>

      {erro && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      {etapas.length === 0 ? (
        <p className="mb-4 text-sm text-gray-500">Nenhuma etapa cadastrada ainda.</p>
      ) : (
        <ul className="mb-4 flex flex-col divide-y divide-gray-100">
          {etapas.map((etapa, i) => (
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
                  disabled={i === etapas.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ▼
                </button>
              </div>
              <span className="w-6 shrink-0 text-sm text-gray-400">{i + 1}.</span>
              <span className="flex-1 text-sm font-medium text-gray-800">{etapa.nome}</span>
              <div className="flex shrink-0 items-center gap-1 text-sm text-gray-600">
                <input
                  type="number"
                  min={1}
                  defaultValue={etapa.sla_dias}
                  onBlur={(e) => atualizarSla(etapa.id, e.target.value)}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                <span>dias de SLA</span>
              </div>
              <button
                onClick={() => excluir(etapa.id)}
                className="shrink-0 text-gray-400 hover:text-red-600"
                aria-label="Remover etapa"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={adicionar} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Nome da etapa</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Briefing"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">SLA (dias)</label>
          <input
            type="number"
            min={1}
            value={slaDias}
            onChange={(e) => setSlaDias(e.target.value)}
            placeholder="Ex: 5"
            className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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
    </div>
  )
}
