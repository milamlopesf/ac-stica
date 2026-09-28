'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reuniao } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { htmlEstaVazio } from '@/lib/utils/texto'

type RascunhoAta = { titulo: string; data: string; participantes: string; conteudo: string }

function chaveRascunho(projetoId: string) {
  return `painel-acustica:rascunho-ata:${projetoId}`
}

function lerRascunho(projetoId: string): RascunhoAta {
  if (typeof window === 'undefined') return { titulo: '', data: '', participantes: '', conteudo: '' }
  try {
    const bruto = localStorage.getItem(chaveRascunho(projetoId))
    if (!bruto) return { titulo: '', data: '', participantes: '', conteudo: '' }
    return { titulo: '', data: '', participantes: '', conteudo: '', ...JSON.parse(bruto) }
  } catch {
    return { titulo: '', data: '', participantes: '', conteudo: '' }
  }
}

export function ReunioesTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [reunioes, setReunioes] = useState<Reuniao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(() => {
    const r = lerRascunho(projetoId)
    return Boolean(r.titulo || r.participantes || !htmlEstaVazio(r.conteudo))
  })
  const [titulo, setTitulo] = useState(() => lerRascunho(projetoId).titulo)
  const [data, setData] = useState(() => lerRascunho(projetoId).data || hojeISO())
  const [participantes, setParticipantes] = useState(() => lerRascunho(projetoId).participantes)
  const [conteudo, setConteudo] = useState(() => lerRascunho(projetoId).conteudo)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const vazio = !titulo.trim() && !participantes.trim() && htmlEstaVazio(conteudo)
    if (vazio) {
      localStorage.removeItem(chaveRascunho(projetoId))
    } else {
      localStorage.setItem(chaveRascunho(projetoId), JSON.stringify({ titulo, data, participantes, conteudo }))
    }
  }, [projetoId, titulo, data, participantes, conteudo])

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
      .insert({
        projeto_id: projetoId,
        titulo: titulo.trim(),
        data,
        participantes: participantes.trim() || null,
        conteudo: htmlEstaVazio(conteudo) ? null : conteudo,
      })
      .select()
      .single()
    setEnviando(false)
    if (error) {
      alert(`Erro ao salvar ata: ${error.message}`)
      return
    }
    setReunioes((prev) => [nova as Reuniao, ...prev])
    setTitulo('')
    setData(hojeISO())
    setParticipantes('')
    setConteudo('')
    setMostrarForm(false)
    localStorage.removeItem(chaveRascunho(projetoId))
  }

  function cancelar() {
    setTitulo('')
    setData(hojeISO())
    setParticipantes('')
    setConteudo('')
    setMostrarForm(false)
    localStorage.removeItem(chaveRascunho(projetoId))
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

  async function atualizarConteudo(id: string, novoConteudo: string) {
    const reuniao = reunioes.find((r) => r.id === id)
    const valor = htmlEstaVazio(novoConteudo) ? null : novoConteudo
    if (!reuniao || reuniao.conteudo === valor) return
    setReunioes((prev) => prev.map((r) => (r.id === id ? { ...r, conteudo: valor } : r)))
    const { error } = await supabase.from('reunioes').update({ conteudo: valor }).eq('id', id)
    if (error) alert(`Erro ao salvar ata: ${error.message}`)
  }

  async function atualizarParticipantes(id: string, novoValor: string) {
    const reuniao = reunioes.find((r) => r.id === id)
    const valor = novoValor.trim() || null
    if (!reuniao || reuniao.participantes === valor) return
    setReunioes((prev) => prev.map((r) => (r.id === id ? { ...r, participantes: valor } : r)))
    const { error } = await supabase.from('reunioes').update({ participantes: valor }).eq('id', id)
    if (error) alert(`Erro ao salvar participantes: ${error.message}`)
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
            value={participantes}
            onChange={(e) => setParticipantes(e.target.value)}
            placeholder="Participantes e empresas (ex: João Silva - AWnet, Maria Souza - Cliente X)"
            rows={2}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <RichTextEditor value={conteudo} onChange={setConteudo} placeholder="Conteúdo da ata..." />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelar}
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
            <li key={reuniao.id} className="pb-3">
              <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-1.5">
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
              {(isEditor || (reuniao.participantes && reuniao.participantes.trim())) && (
                <div className="mt-2">
                  <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Participantes
                  </p>
                  {isEditor ? (
                    <textarea
                      key={reuniao.id}
                      defaultValue={reuniao.participantes ?? ''}
                      onBlur={(e) => atualizarParticipantes(reuniao.id, e.target.value)}
                      placeholder="Nomes e empresas..."
                      rows={2}
                      className="w-full resize-none rounded-md border border-transparent px-1.5 py-1 text-sm text-gray-700 transition-colors hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap px-1.5 text-sm text-gray-700">{reuniao.participantes}</p>
                  )}
                </div>
              )}
              {(isEditor || (reuniao.conteudo && !htmlEstaVazio(reuniao.conteudo))) && (
                <div className="mt-2">
                  <RichTextEditor
                    value={reuniao.conteudo ?? ''}
                    editable={isEditor}
                    mostrarBarra={false}
                    placeholder={isEditor ? 'Conteúdo da ata...' : undefined}
                    onBlur={(html) => atualizarConteudo(reuniao.id, html)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
