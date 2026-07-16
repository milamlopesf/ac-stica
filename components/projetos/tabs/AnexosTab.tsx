'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Anexo } from '@/lib/types/database'

const BUCKET = 'anexos-projetos'

function formatarTamanho(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnexosTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

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
    const caminho = `${projetoId}/${Date.now()}-${arquivo.name}`

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

  async function baixar(anexo: Anexo) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(anexo.caminho_storage, 60)
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
                  onClick={() => baixar(anexo)}
                  className="truncate text-sm font-medium text-blue-700 hover:underline"
                  title={anexo.nome_arquivo}
                >
                  {anexo.nome_arquivo}
                </button>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatarTamanho(anexo.tamanho_bytes)}
                </span>
              </div>
              {isEditor && (
                <button
                  onClick={() => excluir(anexo)}
                  className="shrink-0 text-gray-400 hover:text-red-600"
                  aria-label="Excluir anexo"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
