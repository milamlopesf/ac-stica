'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Nota } from '@/lib/types/database'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { htmlEstaVazio } from '@/lib/utils/texto'

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function chaveRascunho(projetoId: string) {
  return `painel-acustica:rascunho-nota:${projetoId}`
}

export function AnotacoesTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [notas, setNotas] = useState<Nota[]>([])
  const [carregando, setCarregando] = useState(true)
  const [texto, setTexto] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(chaveRascunho(projetoId)) ?? ''
  })
  const [enviando, setEnviando] = useState(false)

  function mudarTexto(html: string) {
    setTexto(html)
    if (htmlEstaVazio(html)) {
      localStorage.removeItem(chaveRascunho(projetoId))
    } else {
      localStorage.setItem(chaveRascunho(projetoId), html)
    }
  }

  useEffect(() => {
    let ativo = true
    supabase
      .from('notas')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setNotas((data as Nota[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    if (htmlEstaVazio(texto)) return
    setEnviando(true)
    const { data, error } = await supabase
      .from('notas')
      .insert({ projeto_id: projetoId, texto })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar anotação: ${error.message}`)
      return
    }
    setNotas((prev) => [data as Nota, ...prev])
    setTexto('')
    localStorage.removeItem(chaveRascunho(projetoId))
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta anotação?')) return
    const { error } = await supabase.from('notas').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setNotas((prev) => prev.filter((n) => n.id !== id))
  }

  async function atualizarNota(id: string, novoTexto: string) {
    const nota = notas.find((n) => n.id === id)
    if (!nota || nota.texto === novoTexto) return
    setNotas((prev) => prev.map((n) => (n.id === id ? { ...n, texto: novoTexto } : n)))
    const { error } = await supabase.from('notas').update({ texto: novoTexto }).eq('id', id)
    if (error) alert(`Erro ao salvar anotação: ${error.message}`)
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && (
        <form onSubmit={adicionar} className="flex flex-col gap-2">
          <RichTextEditor value={texto} onChange={mudarTexto} placeholder="Escrever uma anotação..." />
          <button
            type="submit"
            disabled={enviando}
            className="self-end rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Adicionar
          </button>
        </form>
      )}

      {notas.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhuma anotação ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notas.map((nota) => (
            <li key={nota.id} className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <RichTextEditor
                    value={nota.texto}
                    editable={isEditor}
                    mostrarBarra={false}
                    onBlur={(html) => atualizarNota(nota.id, html)}
                  />
                </div>
                {isEditor && (
                  <button
                    onClick={() => excluir(nota.id)}
                    className="shrink-0 text-gray-400 hover:text-red-600"
                    aria-label="Excluir anotação"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="mt-1 border-t border-gray-100 pt-1.5 text-xs text-gray-400">
                {formatarDataHora(nota.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
