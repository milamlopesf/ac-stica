'use client'

import { useState } from 'react'
import type { CategoriaBiblioteca, ItemBiblioteca } from '@/lib/types/database'
import { CATEGORIAS_BIBLIOTECA } from '@/lib/utils/biblioteca'
import { formatarTamanho } from '@/lib/utils/storage'
import { textoSimples } from '@/lib/utils/texto'
import { BibliotecaFormModal } from './BibliotecaFormModal'
import { BibliotecaDetalheModal } from './BibliotecaDetalheModal'

function iconePara(nomeArquivo: string) {
  return /\.(xls|xlsx)$/i.test(nomeArquivo) ? '📊' : '📄'
}

export function BibliotecaClient({
  categoria,
  itensIniciais,
  isEditor,
}: {
  categoria: CategoriaBiblioteca
  itensIniciais: ItemBiblioteca[]
  isEditor: boolean
}) {
  const [itens, setItens] = useState<ItemBiblioteca[]>(itensIniciais)
  const [busca, setBusca] = useState('')
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  const itensFiltrados = itens.filter((i) => i.titulo.toLowerCase().includes(busca.toLowerCase()))
  const selecionado = itens.find((i) => i.id === selecionadoId) ?? null

  function handleCriado(novo: ItemBiblioteca) {
    setItens((prev) => [...prev, novo].sort((a, b) => a.titulo.localeCompare(b.titulo)))
    setModalNovoAberto(false)
  }

  function handleAtualizado(atualizado: ItemBiblioteca) {
    setItens((prev) => prev.map((i) => (i.id === atualizado.id ? atualizado : i)))
  }

  function handleExcluido(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id))
    setSelecionadoId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{CATEGORIAS_BIBLIOTECA[categoria].titulo}</h1>
        {isEditor && (
          <button
            onClick={() => setModalNovoAberto(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo Item
          </button>
        )}
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por título..."
        className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {itensFiltrados.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">Nenhum item encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {itensFiltrados.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelecionadoId(item.id)}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">{iconePara(item.nome_arquivo)}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{item.titulo}</p>
                  {item.descricao && textoSimples(item.descricao) && (
                    <p className="truncate text-sm text-gray-500">{textoSimples(item.descricao)}</p>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {formatarTamanho(item.tamanho_bytes)}
              </span>
            </button>
          ))}
        </div>
      )}

      {isEditor && modalNovoAberto && (
        <BibliotecaFormModal
          categoria={categoria}
          onFechar={() => setModalNovoAberto(false)}
          onSalvo={handleCriado}
        />
      )}

      {selecionado && (
        <BibliotecaDetalheModal
          item={selecionado}
          isEditor={isEditor}
          onFechar={() => setSelecionadoId(null)}
          onAtualizado={handleAtualizado}
          onExcluido={handleExcluido}
        />
      )}
    </div>
  )
}
