'use client'

import { useMemo, useState } from 'react'
import type { Etapa, Projeto, StatusProjeto } from '@/lib/types/database'
import { CORES_ETAPA, ETAPAS, STATUS_PROJETO } from '@/lib/utils/cores'
import { corCategorica } from '@/lib/utils/paleta'
import { estaAtrasado } from '@/lib/utils/projetos'
import { hojeISO } from '@/lib/utils/data'
import { DonutChart, type DonutDatum } from './DonutChart'
import { RelatorioGeralSection } from './RelatorioGeralSection'
import { RelatorioProjetoSection } from './RelatorioProjetoSection'

function agruparPorCampo(projetos: Projeto[], campo: 'diretor' | 'projetista'): DonutDatum[] {
  const contagem = new Map<string, number>()
  for (const p of projetos) {
    const chave = p[campo]?.trim() || 'Não atribuído'
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
  }
  return Array.from(contagem.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([nome, valor], i) => ({ nome, valor, cor: corCategorica(i) }))
}

export function PaineisClient({ projetos }: { projetos: Projeto[] }) {
  const [filtroEtapa, setFiltroEtapa] = useState<Etapa | ''>('')
  const [filtroStatus, setFiltroStatus] = useState<StatusProjeto | ''>('')
  const [filtroDiretor, setFiltroDiretor] = useState('')
  const [filtroGerente, setFiltroGerente] = useState('')
  const [filtroProjetista, setFiltroProjetista] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  const hoje = hojeISO()

  const diretores = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.diretor).filter(Boolean))) as string[],
    [projetos]
  )
  const gerentes = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.gerente).filter(Boolean))) as string[],
    [projetos]
  )
  const projetistas = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.projetista).filter(Boolean))) as string[],
    [projetos]
  )

  const filtroAtivo = Boolean(
    filtroEtapa ||
      filtroStatus ||
      filtroDiretor ||
      filtroGerente ||
      filtroProjetista ||
      filtroDataInicio ||
      filtroDataFim
  )

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((p) => {
      if (filtroEtapa && p.etapa !== filtroEtapa) return false
      if (filtroStatus) {
        if (filtroStatus === 'Atrasado') {
          if (!estaAtrasado(p, hoje)) return false
        } else if (p.status !== filtroStatus) {
          return false
        }
      }
      if (filtroDiretor && p.diretor !== filtroDiretor) return false
      if (filtroGerente && p.gerente !== filtroGerente) return false
      if (filtroProjetista && p.projetista !== filtroProjetista) return false
      if (filtroDataInicio && (!p.entrega || p.entrega < filtroDataInicio)) return false
      if (filtroDataFim && (!p.entrega || p.entrega > filtroDataFim)) return false
      return true
    })
  }, [
    projetos,
    filtroEtapa,
    filtroStatus,
    filtroDiretor,
    filtroGerente,
    filtroProjetista,
    filtroDataInicio,
    filtroDataFim,
    hoje,
  ])

  function limparFiltros() {
    setFiltroEtapa('')
    setFiltroStatus('')
    setFiltroDiretor('')
    setFiltroGerente('')
    setFiltroProjetista('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
  }

  const ETAPAS_DESENVOLVIMENTO: Etapa[] = ['EP', 'AP', 'EX']

  const porEtapa: DonutDatum[] = [
    { nome: CORES_ETAPA.DNN.label, valor: 0, cor: CORES_ETAPA.DNN.hex, etapa: 'DNN' as Etapa },
    { nome: 'Desenvolvimento/Projetos', valor: 0, cor: CORES_ETAPA.EX.hex, etapa: null },
    { nome: CORES_ETAPA.OBRA.label, valor: 0, cor: CORES_ETAPA.OBRA.hex, etapa: 'OBRA' as Etapa },
    { nome: CORES_ETAPA.GARANTIA.label, valor: 0, cor: CORES_ETAPA.GARANTIA.hex, etapa: 'GARANTIA' as Etapa },
  ]
    .map((d) => ({
      nome: d.nome,
      cor: d.cor,
      valor: d.etapa
        ? projetosFiltrados.filter((p) => p.etapa === d.etapa).length
        : projetosFiltrados.filter((p) => ETAPAS_DESENVOLVIMENTO.includes(p.etapa)).length,
    }))
    .filter((d) => d.valor > 0)

  const porDiretor = agruparPorCampo(projetosFiltrados, 'diretor')
  const porProjetista = agruparPorCampo(projetosFiltrados, 'projetista')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Etapa</label>
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value as Etapa | '')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {ETAPAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusProjeto | '')}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {STATUS_PROJETO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Diretor</label>
          <select
            value={filtroDiretor}
            onChange={(e) => setFiltroDiretor(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {diretores.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Gerente</label>
          <select
            value={filtroGerente}
            onChange={(e) => setFiltroGerente(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {gerentes.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Projetista acústico</label>
          <select
            value={filtroProjetista}
            onChange={(e) => setFiltroProjetista(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {projetistas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Entrega de</label>
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">até</label>
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>

        {filtroAtivo && (
          <button
            onClick={limparFiltros}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          {filtroAtivo ? 'Total de projetos (filtrado)' : 'Total de projetos'}
        </p>
        <p className="text-4xl font-semibold text-gray-900">{projetosFiltrados.length}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <DonutChart titulo="Projetos por etapa" dados={porEtapa} />
        <DonutChart titulo="Projetos por diretor" dados={porDiretor} />
        <DonutChart titulo="Projetos por projetista acústico" dados={porProjetista} />
      </div>

      <RelatorioGeralSection projetos={projetosFiltrados} />

      <RelatorioProjetoSection projetos={projetosFiltrados} />
    </div>
  )
}
