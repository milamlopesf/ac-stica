'use client'

import { useMemo, useState } from 'react'
import type { Projeto } from '@/lib/types/database'
import { ETAPAS, STATUS_PROJETO } from '@/lib/utils/cores'
import { ProjetoCard } from './ProjetoCard'
import { ProjetoDetalhePanel } from './ProjetoDetalhePanel'
import { ProjetoFormModal } from './ProjetoFormModal'

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
  const [filtroResponsavel, setFiltroResponsavel] = useState('')
  const [filtroProjetista, setFiltroProjetista] = useState('')
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)

  const responsaveis = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.responsavel).filter(Boolean))) as string[],
    [projetos]
  )
  const projetistas = useMemo(
    () => Array.from(new Set(projetos.map((p) => p.projetista).filter(Boolean))) as string[],
    [projetos]
  )

  const projetosFiltrados = useMemo(() => {
    return projetos.filter((p) => {
      if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false
      if (filtroEtapa && p.etapa !== filtroEtapa) return false
      if (filtroStatus && p.status !== filtroStatus) return false
      if (filtroResponsavel && p.responsavel !== filtroResponsavel) return false
      if (filtroProjetista && p.projetista !== filtroProjetista) return false
      return true
    })
  }, [projetos, busca, filtroEtapa, filtroStatus, filtroResponsavel, filtroProjetista])

  function handleProjetoCriado(novo: Projeto) {
    setProjetos((prev) => [...prev, novo])
    setModalNovoAberto(false)
  }

  function handleProjetoAtualizado(atualizado: Projeto) {
    setProjetos((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)))
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
        {isEditor && (
          <button
            onClick={() => setModalNovoAberto(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo Projeto
          </button>
        )}
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
          value={filtroResponsavel}
          onChange={(e) => setFiltroResponsavel(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Todos os responsáveis</option>
          {responsaveis.map((r) => (
            <option key={r} value={r}>
              {r}
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projetosFiltrados.map((projeto) => (
            <ProjetoCard key={projeto.id} projeto={projeto} onClick={() => setSelecionadoId(projeto.id)} />
          ))}
        </div>
      )}

      {selecionado && (
        <ProjetoDetalhePanel
          projeto={selecionado}
          isEditor={isEditor}
          responsaveisExistentes={responsaveis}
          onFechar={() => setSelecionadoId(null)}
          onAtualizado={handleProjetoAtualizado}
          onExcluido={handleProjetoExcluido}
        />
      )}

      {modalNovoAberto && (
        <ProjetoFormModal
          responsaveisExistentes={responsaveis}
          onFechar={() => setModalNovoAberto(false)}
          onSalvo={handleProjetoCriado}
        />
      )}
    </div>
  )
}
