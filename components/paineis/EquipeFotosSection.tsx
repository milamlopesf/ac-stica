'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PessoaEquipe } from '@/lib/types/database'
import { sanitizarNomeArquivo } from '@/lib/utils/storage'
import { FotoPessoaThumb } from '@/components/projetos/FotoPessoaThumb'

const BUCKET = 'fotos-equipe'

export function EquipeFotosSection({ nomesExistentes }: { nomesExistentes: string[] }) {
  const supabase = createClient()
  const [pessoas, setPessoas] = useState<PessoaEquipe[]>([])
  const [carregando, setCarregando] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [enviandoId, setEnviandoId] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    let ativo = true
    supabase
      .from('pessoas_equipe')
      .select('*')
      .order('nome', { ascending: true })
      .then(({ data }) => {
        if (ativo) {
          setPessoas((data as PessoaEquipe[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [supabase])

  const nomesCadastrados = new Set(pessoas.map((p) => p.nome))
  const nomesSemCadastro = nomesExistentes.filter((n) => !nomesCadastrados.has(n)).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  async function criarPessoa(nome: string) {
    const limpo = nome.trim()
    if (!limpo || nomesCadastrados.has(limpo)) return
    setErro('')
    const { data, error } = await supabase.from('pessoas_equipe').insert({ nome: limpo }).select().single()
    if (error) {
      setErro(`Erro ao cadastrar: ${error.message}`)
      return
    }
    setPessoas((prev) => [...prev, data as PessoaEquipe].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    setNovoNome('')
  }

  async function handleUpload(pessoa: PessoaEquipe, arquivo: File) {
    setErro('')
    setEnviandoId(pessoa.id)

    const caminhoAntigo = pessoa.foto_storage
    const caminho = `${pessoa.id}/${Date.now()}-${sanitizarNomeArquivo(arquivo.name)}`

    const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo)
    if (erroUpload) {
      setEnviandoId(null)
      setErro(`Erro ao enviar foto: ${erroUpload.message}`)
      return
    }

    const { data, error: erroUpdate } = await supabase
      .from('pessoas_equipe')
      .update({ foto_storage: caminho })
      .eq('id', pessoa.id)
      .select()
      .single()

    setEnviandoId(null)
    if (erroUpdate) {
      setErro(`Erro ao salvar foto: ${erroUpdate.message}`)
      return
    }

    if (caminhoAntigo) await supabase.storage.from(BUCKET).remove([caminhoAntigo])
    setPessoas((prev) => prev.map((p) => (p.id === pessoa.id ? (data as PessoaEquipe) : p)))
  }

  async function removerFoto(pessoa: PessoaEquipe) {
    if (!pessoa.foto_storage) return
    if (!confirm(`Remover a foto de ${pessoa.nome}?`)) return
    setErro('')
    const caminhoAntigo = pessoa.foto_storage

    const { data, error } = await supabase
      .from('pessoas_equipe')
      .update({ foto_storage: null })
      .eq('id', pessoa.id)
      .select()
      .single()

    if (error) {
      setErro(`Erro ao remover foto: ${error.message}`)
      return
    }
    await supabase.storage.from(BUCKET).remove([caminhoAntigo])
    setPessoas((prev) => prev.map((p) => (p.id === pessoa.id ? (data as PessoaEquipe) : p)))
  }

  async function excluirPessoa(pessoa: PessoaEquipe) {
    if (!confirm(`Remover ${pessoa.nome} do cadastro de equipe?`)) return
    const { error } = await supabase.from('pessoas_equipe').delete().eq('id', pessoa.id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    if (pessoa.foto_storage) await supabase.storage.from(BUCKET).remove([pessoa.foto_storage])
    setPessoas((prev) => prev.filter((p) => p.id !== pessoa.id))
  }

  if (carregando) return null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Diretores e Gerentes</h2>
      <p className="mb-4 text-sm text-gray-500">
        A foto cadastrada aqui aparece automaticamente em todo projeto onde o nome da pessoa estiver em
        &quot;Diretor&quot; ou &quot;Gerente&quot; — não precisa subir de novo em cada projeto.
      </p>

      {erro && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>
      )}

      {pessoas.length === 0 ? (
        <p className="mb-4 text-sm text-gray-500">Nenhuma pessoa cadastrada ainda.</p>
      ) : (
        <ul className="mb-4 flex flex-col divide-y divide-gray-100">
          {pessoas.map((pessoa) => (
            <li key={pessoa.id} className="flex items-center gap-3 py-2.5">
              <FotoPessoaThumb
                caminho={pessoa.foto_storage}
                nome={pessoa.nome}
                className="h-9 w-9 shrink-0 rounded-full border border-gray-100 object-cover"
              />
              <span className="flex-1 text-sm font-medium text-gray-800">{pessoa.nome}</span>
              <label className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                {enviandoId === pessoa.id ? 'Enviando...' : pessoa.foto_storage ? 'Trocar foto' : '+ Foto'}
                <input
                  ref={(el) => {
                    inputsRef.current[pessoa.id] = el
                  }}
                  type="file"
                  accept="image/*"
                  disabled={enviandoId === pessoa.id}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    if (arquivo) handleUpload(pessoa, arquivo)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
              </label>
              {pessoa.foto_storage && (
                <button onClick={() => removerFoto(pessoa)} className="text-xs text-gray-400 hover:text-red-600">
                  Remover
                </button>
              )}
              <button
                onClick={() => excluirPessoa(pessoa)}
                className="shrink-0 text-gray-400 hover:text-red-600"
                aria-label={`Excluir ${pessoa.nome} do cadastro`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          criarPessoa(novoNome)
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          list="nomes-equipe-existentes"
          placeholder="Nome do diretor ou gerente"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <datalist id="nomes-equipe-existentes">
          {nomesSemCadastro.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Cadastrar pessoa
        </button>
      </form>

      {nomesSemCadastro.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          Sem foto ainda: {nomesSemCadastro.join(', ')}
        </p>
      )}
    </div>
  )
}
