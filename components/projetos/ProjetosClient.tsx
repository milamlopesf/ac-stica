'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'
import { ETAPAS, STATUS_PROJETO } from '@/lib/utils/cores'
import { ProjetoCard } from './ProjetoCard'
import { ProjetoListItem } from './ProjetoListItem'
import { ProjetoDetalhePanel } from './ProjetoDetalhePanel'
import { ProjetoFormModal } from './ProjetoFormModal'

type Visualizacao = 'lista' | 'grade'
const CHAVE_VISUALIZACAO = 'painel-acustica:projetos-visualizacao'

type ProgressoPorProjeto = Record<string, { concluidas: number; total: number }>

export function ProjetosClient({
  projetosIniciais,
  isEditor,
}: {
  projetosIniciais: Projeto[]
  isEditor: boolean
}) {
  const [projetos, setProjetos] = useState<Projeto[]>(projetosIniciais)
  const [busca, setBusca] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroDiretor, setFiltroDiretor] = useState('')
  const [filtroGerente, setFiltroGerente] = useState('')
  const [filtroProjetista, setFiltroProjetista] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [visualizacao, setVisualizacao] = useState<Visualizacao>(() => {
    if (typeof window === 'undefined') return 'lista'
    const salva = localStorage.getItem(CHAVE_VISUALIZACAO)
    return salva === 'lista' || salva === 'grade' ? salva : 'lista'
  })

  function mudarVisualizacao(v: Visualizacao) {
    setVisualizacao(v)
    localStorage.setItem(CHAVE_VISUALIZACAO, v)
  }

  const [progressoPorProjeto, setProgressoPorProjeto] = useState<ProgressoPorProjeto>({})

  function calcularProgresso(linhas: { projeto_id: string | null; status: string }[]) {
    const mapa: ProgressoPorProjeto = {}
    for (const a of linhas) {
      if (!a.projeto_id) continue
      if (!mapa[a.projeto_id]) mapa[a.projeto_id] = { concluidas: 0, total: 0 }
      mapa[a.projeto_id].total += 1
      if (a.status === 'concluido') mapa[a.projeto_id].concluidas += 1
    }
    return mapa
  }

  const carregarProgresso = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('atividades').select('projeto_id, status')
    setProgressoPorProjeto(calcularProgresso(data ?? []))
  }, [])

  const recarregarProjetos = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projetos')
      .select('*')
      .order('entrega', { ascending: false, nullsFirst: false })
    if (data) setProjetos(data as Projeto[])
  }, [])

  useEffect(() => {
    let ativo = true
    const supabase = createClient()
    supabase
      .from('atividades')
      .select('projeto_id, status')
      .then(({ data }) => {
        if (ativo) setProgressoPorProjeto(calcularProgresso(data ?? []))
      })
    return () => {
      ativo = false
    }
  }, [])

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
  const projetosPorId = useMemo(() => new Map(projetos.map((p) => [p.id, p])), [projetos])

  const projetosFiltrados = useMemo(() => {
    return projetos
      .filter((p) => {
        if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false
        if (filtroEtapa && p.etapa !== filtroEtapa) return false
        if (filtroStatus && p.status !== filtroStatus) return false
        if (filtroDiretor && p.diretor !== filtroDiretor) return false
        if (filtroGerente && p.gerente !== filtroGerente) return false
        if (filtroProjetista && p.projetista !== filtroProjetista) return false
        return true
      })
      .sort((a, b) => {
        if (!a.entrega && !b.entrega) return 0
        if (!a.entrega) return 1
        if (!b.entrega) return -1
        return b.entrega.localeCompare(a.entrega)
      })
  }, [projetos, busca, filtroEtapa, filtroStatus, filtroDiretor, filtroGerente, filtroProjetista])

  function handleProjetoCriado(novo: Projeto) {
    setProjetos((prev) => [...prev, novo])
    setModalNovoAberto(false)
    recarregarProjetos()
  }

  function handleProjetoAtualizado(atualizado: Projeto) {
    setProjetos((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)))
    recarregarProjetos()
  }

  function handleProjetoExcluido(id: string) {
    setProjetos((prev) => prev.filter((p) => p.id !== id))
    setSelecionadoId(null)
  }

  const selecionado = projetos.find((p) => p.id === selecionadoId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Projetos</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-gray-300 p-0.5">
            <button
              onClick={() => mudarVisualizacao('lista')}
              className={clsx(
                'rounded px-3 py-1 text-sm font-medium',
                visualizacao === 'lista' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Lista
            </button>
            <button
              onClick={() => mudarVisualizacao('grade')}
              className={clsx(
                'rounded px-3 py-1 text-sm font-medium',
                visualizacao === 'grade' ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Grade
            </button>
          </div>
          {isEditor && (
            <button
              onClick={() => setModalNovoAberto(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Novo Projeto
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todas as etapas</option>
          {ETAPAS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos os status</option>
          {STATUS_PROJETO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filtroDiretor}
          onChange={(e) => setFiltroDiretor(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos os diretores</option>
          {diretores.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={filtroGerente}
          onChange={(e) => setFiltroGerente(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos os gerentes</option>
          {gerentes.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={filtroProjetista}
          onChange={(e) => setFiltroProjetista(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos os projetistas</option>
          {projetistas.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {projetosFiltrados.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">Nenhum projeto encontrado.</p>
      ) : visualizacao === 'lista' ? (
        <div className="flex flex-col gap-2">
          {projetosFiltrados.map((projeto) => (
            <ProjetoListItem
              key={projeto.id}
              projeto={projeto}
              nomeVinculado={
                projeto.projeto_vinculado_id
                  ? projetosPorId.get(projeto.projeto_vinculado_id)?.nome
                  : undefined
              }
              progresso={progressoPorProjeto[projeto.id]}
              onClick={() => setSelecionadoId(projeto.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projetosFiltrados.map((projeto) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              nomeVinculado={
                projeto.projeto_vinculado_id
                  ? projetosPorId.get(projeto.projeto_vinculado_id)?.nome
                  : undefined
              }
              progresso={progressoPorProjeto[projeto.id]}
              onClick={() => setSelecionadoId(projeto.id)}
            />
          ))}
        </div>
      )}

      {selecionado && (
        <ProjetoDetalhePanel
          key={selecionado.id}
          projeto={selecionado}
          isEditor={isEditor}
          gerentesExistentes={gerentes}
          outrosProjetos={projetos.filter((p) => p.id !== selecionado.id)}
          projetoVinculado={
            selecionado.projeto_vinculado_id
              ? projetosPorId.get(selecionado.projeto_vinculado_id)
              : undefined
          }
          progresso={progressoPorProjeto[selecionado.id]}
          onFechar={() => {
            setSelecionadoId(null)
            carregarProgresso()
          }}
          onAtualizado={handleProjetoAtualizado}
          onExcluido={handleProjetoExcluido}
          onAbrirVinculado={(id) => setSelecionadoId(id)}
        />
      )}

      {modalNovoAberto && (
        <ProjetoFormModal
          outrosProjetos={projetos}
          gerentesExistentes={gerentes}
          onFechar={() => setModalNovoAberto(false)}
          onSalvo={handleProjetoCriado}
        />
      )}
    </div>
  )
}
