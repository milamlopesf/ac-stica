'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'
import { sanitizarNomeArquivo } from '@/lib/utils/storage'

const BUCKET = 'logos-clientes'

export function LogoClienteProjeto({
  projeto,
  isEditor,
  onAtualizado,
}: {
  projeto: Projeto
  isEditor: boolean
  onAtualizado: (p: Projeto) => void
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const temLogo = Boolean(projeto.logo_cliente_storage)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErro('')
    setEnviando(true)

    const caminhoAntigo = projeto.logo_cliente_storage
    const caminho = `${projeto.id}/${Date.now()}-${sanitizarNomeArquivo(arquivo.name)}`

    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)
    if (erroUpload) {
      setEnviando(false)
      setErro(`Erro ao enviar logo: ${erroUpload.message}`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const { data, error: erroUpdate } = await supabase
      .from('projetos')
      .update({ logo_cliente_storage: caminho })
      .eq('id', projeto.id)
      .select()
      .single()

    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ''

    if (erroUpdate) {
      setErro(`Erro ao salvar logo: ${erroUpdate.message}`)
      return
    }

    if (caminhoAntigo) await supabase.storage.from(BUCKET).remove([caminhoAntigo])
    onAtualizado(data as Projeto)
  }

  async function remover() {
    if (!projeto.logo_cliente_storage) return
    if (!confirm('Remover a logo do cliente deste projeto?')) return
    setErro('')
    const caminhoAntigo = projeto.logo_cliente_storage

    const { data, error } = await supabase
      .from('projetos')
      .update({ logo_cliente_storage: null })
      .eq('id', projeto.id)
      .select()
      .single()

    if (error) {
      setErro(`Erro ao remover logo: ${error.message}`)
      return
    }
    await supabase.storage.from(BUCKET).remove([caminhoAntigo])
    onAtualizado(data as Projeto)
  }

  if (!isEditor) return null

  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
        {enviando ? 'Enviando...' : temLogo ? 'Trocar logo do cliente' : '+ Logo do cliente'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={enviando}
          onChange={handleUpload}
          className="hidden"
        />
      </label>
      {temLogo && (
        <button type="button" onClick={remover} className="text-xs text-gray-400 hover:text-red-600">
          Remover
        </button>
      )}
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  )
}
