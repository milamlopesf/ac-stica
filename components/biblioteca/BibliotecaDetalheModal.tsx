'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ItemBiblioteca } from '@/lib/types/database'
import { MODELOS_LAUDO, SUBCATEGORIAS_LAUDO } from '@/lib/utils/biblioteca'
import { formatarTamanho } from '@/lib/utils/storage'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { htmlEstaVazio } from '@/lib/utils/texto'

const BUCKET = 'biblioteca-documentos'

export function BibliotecaDetalheModal({
  item,
  isEditor,
  fornecedoresExistentes = [],
  rwsExistentes = [],
  onFechar,
  onAtualizado,
  onExcluido,
}: {
  item: ItemBiblioteca
  isEditor: boolean
  fornecedoresExistentes?: string[]
  rwsExistentes?: string[]
  onFechar: () => void
  onAtualizado: (item: ItemBiblioteca) => void
  onExcluido: (id: string) => void
}) {
  const supabase = createClient()
  const [titulo, setTitulo] = useState(item.titulo)
  const [descricao, setDescricao] = useState(item.descricao ?? '')
  const [fornecedor, setFornecedor] = useState(item.fornecedor ?? '')
  const [rw, setRw] = useState(item.rw ?? '')
  const [modelo, setModelo] = useState(item.modelo ?? '')
  const [subcategoria, setSubcategoria] = useState(item.subcategoria ?? '')
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState('')
  const [visualizando, setVisualizando] = useState<string | null>(null)

  const ehPdf = /\.pdf$/i.test(item.nome_arquivo)

  const alterado =
    titulo !== item.titulo ||
    descricao !== (item.descricao ?? '') ||
    fornecedor !== (item.fornecedor ?? '') ||
    rw !== (item.rw ?? '') ||
    modelo !== (item.modelo ?? '') ||
    subcategoria !== (item.subcategoria ?? '')

  async function salvar() {
    setSalvando(true)
    setErro('')
    const { data, error } = await supabase
      .from('biblioteca')
      .update({
        titulo,
        descricao: htmlEstaVazio(descricao) ? null : descricao,
        fornecedor: fornecedor || null,
        rw: rw || null,
        modelo: modelo || null,
        subcategoria: subcategoria || null,
      })
      .eq('id', item.id)
      .select()
      .single()
    setSalvando(false)
    if (error) {
      setErro(error.message)
      return
    }
    onAtualizado(data as ItemBiblioteca)
  }

  async function visualizar() {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(item.caminho_storage, 300)
    if (error || !data) {
      alert(`Erro ao abrir o arquivo: ${error?.message ?? ''}`)
      return
    }
    setVisualizando(data.signedUrl)
  }

  async function baixar() {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(item.caminho_storage, 60, { download: item.nome_arquivo })
    if (error || !data) {
      alert(`Erro ao gerar link de download: ${error?.message ?? ''}`)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function excluir() {
    if (!confirm(`Excluir o item "${item.titulo}"? Essa ação não pode ser desfeita.`)) return
    setExcluindo(true)
    const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([item.caminho_storage])
    if (erroStorage) {
      setExcluindo(false)
      alert(`Erro ao excluir arquivo: ${erroStorage.message}`)
      return
    }
    const { error: erroDelete } = await supabase.from('biblioteca').delete().eq('id', item.id)
    setExcluindo(false)
    if (erroDelete) {
      alert(`Erro ao excluir registro: ${erroDelete.message}`)
      return
    }
    onExcluido(item.id)
  }

  return (
    <>
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Detalhe do item</h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
            ✕
          </button>
        </div>

        {erro && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Título</label>
            <input
              value={titulo}
              disabled={!isEditor}
              onChange={(e) => setTitulo(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
            />
          </div>

          {(isEditor || !htmlEstaVazio(descricao)) && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Descrição</label>
              <RichTextEditor
                value={descricao}
                editable={isEditor}
                onChange={setDescricao}
                placeholder="Breve descrição do item..."
              />
            </div>
          )}

          {item.categoria === 'laudos' && (isEditor || fornecedor || rw || modelo || subcategoria) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Fornecedor</label>
                <input
                  value={fornecedor}
                  disabled={!isEditor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  list="fornecedores-existentes-detalhe"
                  placeholder="Digite ou escolha"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
                />
                <datalist id="fornecedores-existentes-detalhe">
                  {fornecedoresExistentes.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">RW</label>
                <input
                  value={rw}
                  disabled={!isEditor}
                  onChange={(e) => setRw(e.target.value)}
                  list="rws-existentes-detalhe"
                  placeholder="Digite ou escolha"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
                />
                <datalist id="rws-existentes-detalhe">
                  {rwsExistentes.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Modelo</label>
                <select
                  value={modelo}
                  disabled={!isEditor}
                  onChange={(e) => setModelo(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
                >
                  <option value="">Selecione...</option>
                  {MODELOS_LAUDO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Subcategoria</label>
                <select
                  value={subcategoria}
                  disabled={!isEditor}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:border-transparent disabled:bg-transparent disabled:px-0"
                >
                  <option value="">Selecione...</option>
                  {SUBCATEGORIAS_LAUDO.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {isEditor && alterado && (
            <button
              onClick={salvar}
              disabled={salvando}
              className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          )}

          <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-xl">📎</span>
              <div className="min-w-0">
                {ehPdf ? (
                  <button
                    onClick={visualizar}
                    className="truncate text-sm font-medium text-blue-700 hover:underline"
                    title={item.nome_arquivo}
                  >
                    {item.nome_arquivo}
                  </button>
                ) : (
                  <p className="truncate text-sm font-medium text-gray-800">{item.nome_arquivo}</p>
                )}
                <p className="text-xs text-gray-400">{formatarTamanho(item.tamanho_bytes)}</p>
              </div>
            </div>
            <button
              onClick={baixar}
              className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Baixar
            </button>
          </div>

          {isEditor && (
            <button
              onClick={excluir}
              disabled={excluindo}
              className="mt-2 self-start rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {excluindo ? 'Excluindo...' : 'Excluir item'}
            </button>
          )}
        </div>
      </div>
    </div>

    {visualizando && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setVisualizando(null)}
      >
        <div
          className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
            <p className="min-w-0 truncate text-sm font-medium text-gray-800" title={item.nome_arquivo}>
              {item.nome_arquivo}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={visualizando}
                download={item.nome_arquivo}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Baixar
              </a>
              <button
                onClick={() => setVisualizando(null)}
                className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
          <iframe src={visualizando} title={item.nome_arquivo} className="flex-1" />
        </div>
      </div>
    )}
    </>
  )
}
