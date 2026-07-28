'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Anexo } from '@/lib/types/database'
import { sanitizarNomeArquivo, formatarTamanho } from '@/lib/utils/storage'

const BUCKET = 'anexos-projetos'

export function AnexosTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [visualizando, setVisualizando] = useState<{ url: string; nome: string } | null>(null)

  useEffect(() => {
    let ativo = true
    supabase
      .from('anexos')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setAnexos((data as Anexo[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro('')

    if (arquivo.type !== 'application/pdf') {
      setErro('Apenas arquivos PDF são aceitos.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setEnviando(true)
    const caminho = `${projetoId}/${Date.now()}-${sanitizarNomeArquivo(arquivo.name)}`

    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)

    if (erroUpload) {
      setEnviando(false)
      setErro(`Erro ao enviar arquivo: ${erroUpload.message}`)
      return
    }

    const { data, error: erroInsert } = await supabase
      .from('anexos')
      .insert({
        projeto_id: projetoId,
        nome_arquivo: arquivo.name,
        caminho_storage: caminho,
        tamanho_bytes: arquivo.size,
      })
      .select()
      .single()

    setEnviando(false)

    if (erroInsert) {
      setErro(`Erro ao registrar anexo: ${erroInsert.message}`)
      return
    }

    setAnexos((prev) => [data as Anexo, ...prev])
    if (inputRef.current) inputRef.current.value = ''
  }

  async function visualizar(anexo: Anexo) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(anexo.caminho_storage, 300)
    if (error || !data) {
      alert(`Erro ao abrir o arquivo: ${error?.message ?? ''}`)
      return
    }
    setVisualizando({ url: data.signedUrl, nome: anexo.nome_arquivo })
  }

  async function baixar(anexo: Anexo) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(anexo.caminho_storage, 60, { download: anexo.nome_arquivo })
    if (error || !data) {
      alert(`Erro ao gerar link de download: ${error?.message ?? ''}`)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function excluir(anexo: Anexo) {
    if (!confirm(`Excluir o anexo "${anexo.nome_arquivo}"?`)) return
    const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([anexo.caminho_storage])
    if (erroStorage) {
      alert(`Erro ao excluir arquivo: ${erroStorage.message}`)
      return
    }
    const { error: erroDelete } = await supabase.from('anexos').delete().eq('id', anexo.id)
    if (erroDelete) {
      alert(`Erro ao excluir registro: ${erroDelete.message}`)
      return
    }
    setAnexos((prev) => prev.filter((a) => a.id !== anexo.id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && (
        <div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            {enviando ? 'Enviando...' : '+ Enviar PDF'}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              disabled={enviando}
              className="hidden"
            />
          </label>
          {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
        </div>
      )}

      {anexos.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhum anexo enviado.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {anexos.map((anexo) => (
            <li key={anexo.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-red-500">📄</span>
                <button
                  onClick={() => visualizar(anexo)}
                  className="truncate text-sm font-medium text-blue-700 hover:underline"
                  title={anexo.nome_arquivo}
                >
                  {anexo.nome_arquivo}
                </button>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatarTamanho(anexo.tamanho_bytes)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => baixar(anexo)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Baixar anexo"
                  title="Baixar"
                >
                  ⬇
                </button>
                {isEditor && (
                  <button
                    onClick={() => excluir(anexo)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Excluir anexo"
                  >
                    ✕
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

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
              <p className="min-w-0 truncate text-sm font-medium text-gray-800" title={visualizando.nome}>
                {visualizando.nome}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={visualizando.url}
                  download={visualizando.nome}
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
            <iframe src={visualizando.url} title={visualizando.nome} className="flex-1" />
          </div>
        </div>
      )}
    </div>
  )
}
