'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CategoriaBiblioteca, ItemBiblioteca } from '@/lib/types/database'
import { CATEGORIAS_BIBLIOTECA, SUBCATEGORIAS_LAUDO } from '@/lib/utils/biblioteca'
import { formatarTamanho } from '@/lib/utils/storage'
import { textoSimples } from '@/lib/utils/texto'
import clsx from 'clsx'
import { Badge } from '@/components/ui/Badge'
import { BibliotecaFormModal } from './BibliotecaFormModal'
import { BibliotecaDetalheModal } from './BibliotecaDetalheModal'

function iconePara(nomeArquivo: string | null) {
  if (!nomeArquivo) return '⏳'
  return /\.(xls|xlsx)$/i.test(nomeArquivo) ? '📊' : /\.(jpe?g|png|webp)$/i.test(nomeArquivo) ? '🖼️' : '📄'
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
  const router = useRouter()
  const [itens, setItens] = useState<ItemBiblioteca[]>(itensIniciais)
  const [busca, setBusca] = useState('')
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('')
  const [filtroRw, setFiltroRw] = useState('')
  const [filtroTipoInstalacao, setFiltroTipoInstalacao] = useState('')
  const [filtroEspessuraVidro, setFiltroEspessuraVidro] = useState('')
  const [filtroComPorta, setFiltroComPorta] = useState('')
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)

  function abrirItem(item: ItemBiblioteca) {
    if (item.ferramenta === 'calculo_tr') {
      router.push('/planilhas/calculo-tr')
      return
    }
    setSelecionadoId(item.id)
  }

  const itensFiltrados = itens.filter((i) => {
    if (!i.titulo.toLowerCase().includes(busca.toLowerCase())) return false
    if (categoria === 'laudos' && filtroSubcategoria && i.subcategoria !== filtroSubcategoria) return false
    if (categoria === 'laudos' && filtroRw && i.rw !== filtroRw) return false
    if (categoria === 'laudos' && filtroTipoInstalacao && i.tipo_instalacao !== filtroTipoInstalacao) return false
    if (categoria === 'laudos' && filtroEspessuraVidro && i.espessura_vidro !== filtroEspessuraVidro) return false
    if (categoria === 'laudos' && filtroComPorta && i.com_porta !== (filtroComPorta === 'sim')) return false
    return true
  })
  const selecionado = itens.find((i) => i.id === selecionadoId) ?? null

  const fornecedoresExistentes = useMemo(
    () => Array.from(new Set(itens.map((i) => i.fornecedor).filter(Boolean))) as string[],
    [itens]
  )
  const rwsExistentes = useMemo(
    () => Array.from(new Set(itens.map((i) => i.rw).filter(Boolean))) as string[],
    [itens]
  )
  const tiposInstalacaoExistentes = useMemo(
    () => Array.from(new Set(itens.map((i) => i.tipo_instalacao).filter(Boolean))) as string[],
    [itens]
  )
  const espessurasVidroExistentes = useMemo(
    () => Array.from(new Set(itens.map((i) => i.espessura_vidro).filter(Boolean))) as string[],
    [itens]
  )

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
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">{CATEGORIAS_BIBLIOTECA[categoria].titulo}</h1>
          {categoria === 'laudos' && (
            <div className="flex gap-1">
              {['Todos', ...SUBCATEGORIAS_LAUDO].map((s) => {
                const valor = s === 'Todos' ? '' : s
                const ativo = filtroSubcategoria === valor
                return (
                  <button
                    key={s}
                    onClick={() => setFiltroSubcategoria(valor)}
                    className={clsx(
                      'rounded-md px-3 py-1.5 text-sm font-medium',
                      ativo ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {isEditor && (
          <button
            onClick={() => setModalNovoAberto(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo Item
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título..."
          className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {categoria === 'laudos' && (
          <>
            <select
              value={filtroRw}
              onChange={(e) => setFiltroRw(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Rw: todos</option>
              {[...rwsExistentes].sort().map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={filtroTipoInstalacao}
              onChange={(e) => setFiltroTipoInstalacao(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Tipo de instalação: todos</option>
              {[...tiposInstalacaoExistentes].sort().map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filtroEspessuraVidro}
              onChange={(e) => setFiltroEspessuraVidro(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Espessura do vidro: todas</option>
              {[...espessurasVidroExistentes].sort().map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <select
              value={filtroComPorta}
              onChange={(e) => setFiltroComPorta(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700"
            >
              <option value="">Porta: todos</option>
              <option value="sim">Com porta</option>
              <option value="nao">Sem porta</option>
            </select>
            {(filtroRw || filtroTipoInstalacao || filtroEspessuraVidro || filtroComPorta) && (
              <button
                onClick={() => {
                  setFiltroRw('')
                  setFiltroTipoInstalacao('')
                  setFiltroEspessuraVidro('')
                  setFiltroComPorta('')
                }}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </>
        )}
      </div>

      {itensFiltrados.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">Nenhum item encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {itensFiltrados.map((item) => (
            <button
              key={item.id}
              onClick={() => abrirItem(item)}
              className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                <span className="shrink-0 text-xl">{item.ferramenta === 'calculo_tr' ? '🧮' : iconePara(item.nome_arquivo)}</span>
                <h3 className="min-w-0 flex-1 truncate font-medium text-gray-900">{item.titulo}</h3>
                {item.ferramenta === 'calculo_tr' && (
                  <Badge label="Ferramenta interativa" className="border-green-200 bg-green-50 text-green-700" />
                )}
                {categoria === 'laudos' && item.modelo && (
                  <Badge label={item.modelo} className="border-blue-200 bg-blue-50 text-blue-700" />
                )}
                {categoria === 'laudos' && item.com_porta && (
                  <Badge
                    label={`Com porta${item.porta_guilhotina ? ' · guilhotina' : ''}`}
                    className="border-purple-200 bg-purple-50 text-purple-700"
                  />
                )}
                {categoria === 'laudos' &&
                  (item.fornecedor || item.rw || item.tipo_instalacao || item.espessura_vidro) && (
                    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {item.fornecedor && (
                        <span>
                          Fornecedor: <span className="font-medium text-gray-700">{item.fornecedor}</span>
                        </span>
                      )}
                      {item.rw && (
                        <span>
                          Rw: <span className="font-medium text-gray-700">{item.rw}</span>
                        </span>
                      )}
                      {item.tipo_instalacao && (
                        <span>
                          <span className="font-medium text-gray-700">{item.tipo_instalacao}</span>
                        </span>
                      )}
                      {item.espessura_vidro && (
                        <span>
                          Vidro: <span className="font-medium text-gray-700">{item.espessura_vidro}</span>
                        </span>
                      )}
                    </div>
                  )}
                {item.caminho_storage ? (
                  <span className="shrink-0 text-xs text-gray-400">
                    {formatarTamanho(item.tamanho_bytes)}
                  </span>
                ) : (
                  item.ferramenta !== 'calculo_tr' && (
                    <Badge label="Pendente de arquivo" className="border-amber-200 bg-amber-50 text-amber-700" />
                  )
                )}
              </div>
              {item.descricao && textoSimples(item.descricao) && (
                <p className="truncate text-sm text-gray-500">{textoSimples(item.descricao)}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {isEditor && modalNovoAberto && (
        <BibliotecaFormModal
          categoria={categoria}
          fornecedoresExistentes={fornecedoresExistentes}
          rwsExistentes={rwsExistentes}
          onFechar={() => setModalNovoAberto(false)}
          onSalvo={handleCriado}
        />
      )}

      {selecionado && (
        <BibliotecaDetalheModal
          item={selecionado}
          isEditor={isEditor}
          fornecedoresExistentes={fornecedoresExistentes}
          rwsExistentes={rwsExistentes}
          onFechar={() => setSelecionadoId(null)}
          onAtualizado={handleAtualizado}
          onExcluido={handleExcluido}
        />
      )}
    </div>
  )
}
