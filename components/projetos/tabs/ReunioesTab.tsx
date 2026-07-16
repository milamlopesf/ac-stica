'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reuniao } from '@/lib/types/database'
import { formatarData } from '@/lib/utils/data'

export function ReunioesTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [reunioes, setReunioes] = useState<Reuniao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase
      .from('reunioes')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setReunioes((data as Reuniao[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim() || !data) return
    setEnviando(true)
    const { data: nova, error } = await supabase
      .from('reunioes')
      .insert({ projeto_id: projetoId, titulo: titulo.trim(), data, conteudo: conteudo || null })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar ata: ${error.message}`)
      return
    }
    setReunioes((prev) => [nova as Reuniao, ...prev])
    setTitulo('')
    setData('')
    setConteudo('')
    setMostrarForm(false)
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta ata de reunião?')) return
    const { error } = await supabase.from('reunioes').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setReunioes((prev) => prev.filter((r) => r.id !== id))
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && !mostrarForm && (
        <button
          onClick={() => setMostrarForm(true)}
          className="self-start rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Nova Ata
        </button>
      )}

      {isEditor && mostrarForm && (
        <form onSubmit={adicionar} className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da reunião"
            required
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Conteúdo da ata..."
            rows={4}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      {reunioes.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhuma ata registrada.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reunioes.map((reuniao) => (
            <li key={reuniao.id} className="rounded-md border border-gray-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{reuniao.titulo}</p>
                  <p className="text-xs text-gray-400">{formatarData(reuniao.data)}</p>
                </div>
                {isEditor && (
                  <button
                    onClick={() => excluir(reuniao.id)}
                    className="shrink-0 text-gray-400 hover:text-red-600"
                    aria-label="Excluir ata"
                  >
                    ✕
                  </button>
                )}
              </div>
              {reuniao.conteudo && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{reuniao.conteudo}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
