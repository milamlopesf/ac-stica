'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CategoriaBiblioteca, ItemBiblioteca } from '@/lib/types/database'
import { TIPOS_ARQUIVO_ACEITOS, extensaoValida } from '@/lib/utils/biblioteca'
import { sanitizarNomeArquivo } from '@/lib/utils/storage'

const BUCKET = 'biblioteca-documentos'

export function BibliotecaFormModal({
  categoria,
  onFechar,
  onSalvo,
}: {
  categoria: CategoriaBiblioteca
  onFechar: () => void
  onSalvo: (item: ItemBiblioteca) => void
}) {
  const supabase = createClient()
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!arquivo) {
      setErro('Selecione um arquivo PDF ou Excel.')
      return
    }
    if (!extensaoValida(arquivo.name)) {
      setErro('Apenas arquivos PDF ou Excel (.pdf, .xls, .xlsx) são aceitos.')
      return
    }

    setSalvando(true)

    const caminho = `${categoria}/${Date.now()}-${sanitizarNomeArquivo(arquivo.name)}`
    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)

    if (erroUpload) {
      setSalvando(false)
      setErro(`Erro ao enviar arquivo: ${erroUpload.message}`)
      return
    }

    const { data, error: erroInsert } = await supabase
      .from('biblioteca')
      .insert({
        categoria,
        titulo,
        descricao: descricao || null,
        nome_arquivo: arquivo.name,
        caminho_storage: caminho,
        tamanho_bytes: arquivo.size,
      })
      .select()
      .single()

    setSalvando(false)

    if (erroInsert) {
      setErro(`Erro ao salvar: ${erroInsert.message}`)
      return
    }

    onSalvo(data as ItemBiblioteca)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Novo Item</h2>

        {erro && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Título</label>
            <input
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Breve descrição do item..."
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Arquivo (PDF ou Excel)</label>
            <input
              required
              type="file"
              accept={TIPOS_ARQUIVO_ACEITOS}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
