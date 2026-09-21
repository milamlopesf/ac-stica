'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'

export function ProjetoPickerTR({
  projetos,
  projetoId,
  onChange,
  onProjetoCriado,
}: {
  projetos: Projeto[]
  projetoId: string
  onChange: (id: string) => void
  onProjetoCriado: (projeto: Projeto) => void
}) {
  const supabase = createClient()
  const [criandoNovo, setCriandoNovo] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState('')

  const opcoes = useMemo(() => [...projetos].sort((a, b) => a.nome.localeCompare(b.nome)), [projetos])

  async function criarProjeto(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeNovo.trim()) return
    setErro('')
    setCriando(true)
    const { data, error } = await supabase
      .from('projetos')
      .insert({ nome: nomeNovo.trim(), etapa: 'DNN', status: 'A Fazer' })
      .select()
      .single()
    setCriando(false)
    if (error) {
      setErro(`Erro ao criar projeto: ${error.message}`)
      return
    }
    const novo = data as Projeto
    onProjetoCriado(novo)
    onChange(novo.id)
    setCriandoNovo(false)
    setNomeNovo('')
  }

  if (criandoNovo) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Nome do novo projeto</label>
        <div className="flex gap-2">
          <input
            autoFocus
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Nome do projeto"
            className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={criarProjeto}
            disabled={criando}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {criando ? 'Criando...' : 'Criar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCriandoNovo(false)
              setErro('')
            }}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
        {erro && <p className="text-xs text-red-600">{erro}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Projeto vinculado</label>
      <div className="flex gap-2">
        <select
          value={projetoId}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Nenhum</option>
          {opcoes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCriandoNovo(true)}
          className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          + Novo projeto
        </button>
      </div>
    </div>
  )
}
