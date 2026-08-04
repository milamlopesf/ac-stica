'use client'

import { useCallback, useMemo, useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'
import { CORES_STATUS, ETAPAS, STATUS_PROJETO } from '@/lib/utils/cores'
import { hojeISO } from '@/lib/utils/data'
import { estaAtrasado } from '@/lib/utils/projetos'
import { ProjetoCard } from './ProjetoCard'
import { ProjetoListItem } from './ProjetoListItem'
import { ProjetoDetalhePanel } from './ProjetoDetalhePanel'
import { ProjetoFormModal } from './ProjetoFormModal'

type Visualizacao = 'lista' | 'grade'
const CHAVE_VISUALIZACAO = 'painel-acustica:projetos-visualizacao'

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
  const [filtroAtrasado, setFiltroAtrasado] = useState(false)
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

  const recarregarProjetos = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('projetos')
      .select('*')
      .order('entrega', { ascending: false, nullsFirst: false })
    if (data) setProjetos(data as Projeto[])
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

  const hoje = hojeISO()

  const contagemPorStatus = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const p of projetos) mapa[p.status] = (mapa[p.status] ?? 0) + 1
    return mapa
  }, [projetos])

  const contagemAtrasados = useMemo(
    () => projetos.filter((p) => estaAtrasado(p, hoje)).length,
    [projetos, hoje]
  )

  const projetosFiltrados = useMemo(() => {
    return projetos
      .filter((p) => {
        if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false
        if (filtroEtapa && p.etapa !== filtroEtapa) return false
        if (filtroStatus && p.status !== filtroStatus) return false
        if (filtroAtrasado && !estaAtrasado(p, hoje)) return false
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
  }, [
    projetos,
    busca,
    filtroEtapa,
    filtroStatus,
    filtroAtrasado,
    hoje,
    filtroDiretor,
    filtroGerente,
    filtroProjetista,
  ])

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
              className="rounded-md bg-teal-900 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              + Novo Projeto
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          onClick={() => {
            setFiltroStatus('')
            setFiltroAtrasado(false)
          }}
          className={clsx(
            'flex flex-col items-start gap-1 rounded-xl border bg-white p-4 text-left transition',
            !filtroStatus && !filtroAtrasado
              ? 'border-teal-400 ring-1 ring-teal-400'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <span className="text-3xl font-bold text-gray-900">{projetos.length}</span>
          <span className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
            Total de projetos
          </span>
        </button>

        {STATUS_PROJETO.filter((status) => status !== 'A Fazer').map((status) => {
          const cor = CORES_STATUS[status]

          if (status === 'Atrasado') {
            const ativo = filtroAtrasado
            return (
              <button
                key={status}
                onClick={() => setFiltroAtrasado(!ativo)}
                title="Projetos com entrega vencida e que não estão concluídos"
                className={clsx(
                  'flex flex-col items-start gap-1 rounded-xl border bg-white p-4 text-left transition',
                  ativo ? 'border-teal-400 ring-1 ring-teal-400' : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <span className="text-3xl font-bold" style={{ color: cor.hex }}>
                  {contagemAtrasados}
                </span>
                <span className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                  {cor.label}
                </span>
              </button>
            )
          }

          const ativo = filtroStatus === status
          return (
            <button
              key={status}
              onClick={() => setFiltroStatus(ativo ? '' : status)}
              className={clsx(
                'flex flex-col items-start gap-1 rounded-xl border bg-white p-4 text-left transition',
                ativo ? 'border-teal-400 ring-1 ring-teal-400' : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <span className="text-3xl font-bold" style={{ color: cor.hex }}>
                {contagemPorStatus[status] ?? 0}
              </span>
              <span className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
                {cor.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full rounded-full border border-gray-300 bg-white py-1.5 pr-3 pl-9 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>
        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
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
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
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
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
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
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
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
          className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700"
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
          onFechar={() => setSelecionadoId(null)}
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
