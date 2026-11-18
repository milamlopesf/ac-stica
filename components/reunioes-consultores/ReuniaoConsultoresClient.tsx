'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { ReuniaoConsultores, TarefaReuniaoConsultores } from '@/lib/types/database'
import { formatarData, hojeISO } from '@/lib/utils/data'
import { htmlEstaVazio } from '@/lib/utils/texto'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { emitirAtaConsultores } from '@/lib/utils/relatorio'

type ReuniaoComTarefas = { reuniao: ReuniaoConsultores; tarefas: TarefaReuniaoConsultores[] }

function tituloPadrao(data: string) {
  return `Reunião de ${formatarData(data)}`
}

function ordenar(lista: ReuniaoComTarefas[]): ReuniaoComTarefas[] {
  return [...lista].sort((a, b) => {
    if (a.reuniao.data !== b.reuniao.data) return a.reuniao.data < b.reuniao.data ? 1 : -1
    return a.reuniao.created_at < b.reuniao.created_at ? 1 : -1
  })
}

export function ReuniaoConsultoresClient({
  reunioesIniciais,
  isEditor,
}: {
  reunioesIniciais: ReuniaoComTarefas[]
  isEditor: boolean
}) {
  const supabase = createClient()
  const [itens, setItens] = useState<ReuniaoComTarefas[]>(reunioesIniciais)
  const [criando, setCriando] = useState(false)
  const [novaTarefaTexto, setNovaTarefaTexto] = useState<Record<string, string>>({})

  async function novaReuniao() {
    setCriando(true)
    const data = hojeISO()
    const { data: nova, error } = await supabase
      .from('reunioes_consultores')
      .insert({ data, titulo: tituloPadrao(data) })
      .select()
      .single()
    setCriando(false)
    if (error) {
      alert(`Erro ao criar reunião: ${error.message}`)
      return
    }
    setItens((prev) => ordenar([{ reuniao: nova as ReuniaoConsultores, tarefas: [] }, ...prev]))
  }

  async function excluirReuniao(id: string) {
    if (!confirm('Excluir esta reunião e todas as suas tarefas?')) return
    const { error } = await supabase.from('reunioes_consultores').delete().eq('id', id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    setItens((prev) => prev.filter((i) => i.reuniao.id !== id))
  }

  function atualizarLocal(id: string, patch: Partial<ReuniaoConsultores>) {
    setItens((prev) =>
      ordenar(prev.map((i) => (i.reuniao.id === id ? { ...i, reuniao: { ...i.reuniao, ...patch } } : i)))
    )
  }

  async function salvarCampo(
    id: string,
    campo: 'titulo' | 'data' | 'participantes' | 'pauta',
    valorBruto: string
  ) {
    const atual = itens.find((i) => i.reuniao.id === id)?.reuniao
    if (!atual) return
    const valor =
      campo === 'titulo' || campo === 'data'
        ? valorBruto.trim() || (campo === 'titulo' ? tituloPadrao(atual.data) : atual.data)
        : campo === 'pauta'
          ? (htmlEstaVazio(valorBruto) ? null : valorBruto)
          : valorBruto.trim() || null
    if (atual[campo] === valor) return
    atualizarLocal(id, { [campo]: valor } as Partial<ReuniaoConsultores>)
    const { error } = await supabase
      .from('reunioes_consultores')
      .update({ [campo]: valor } as Partial<Omit<ReuniaoConsultores, 'id' | 'created_at'>>)
      .eq('id', id)
    if (error) alert(`Erro ao salvar: ${error.message}`)
  }

  function atualizarTarefasLocal(reuniaoId: string, tarefas: TarefaReuniaoConsultores[]) {
    setItens((prev) => prev.map((i) => (i.reuniao.id === reuniaoId ? { ...i, tarefas } : i)))
  }

  async function adicionarTarefa(reuniaoId: string) {
    const texto = (novaTarefaTexto[reuniaoId] ?? '').trim()
    if (!texto) return
    const item = itens.find((i) => i.reuniao.id === reuniaoId)
    const ordem = item?.tarefas.length ?? 0
    setNovaTarefaTexto((prev) => ({ ...prev, [reuniaoId]: '' }))
    const { data: nova, error } = await supabase
      .from('reunioes_consultores_tarefas')
      .insert({ reuniao_id: reuniaoId, texto, ordem })
      .select()
      .single()
    if (error) {
      alert(`Erro ao adicionar tarefa: ${error.message}`)
      return
    }
    atualizarTarefasLocal(reuniaoId, [...(item?.tarefas ?? []), nova as TarefaReuniaoConsultores])
  }

  async function alternarTarefa(reuniaoId: string, tarefa: TarefaReuniaoConsultores) {
    const concluido = !tarefa.concluido
    const concluido_em = concluido ? hojeISO() : null
    const item = itens.find((i) => i.reuniao.id === reuniaoId)
    atualizarTarefasLocal(
      reuniaoId,
      (item?.tarefas ?? []).map((t) => (t.id === tarefa.id ? { ...t, concluido, concluido_em } : t))
    )
    const { error } = await supabase
      .from('reunioes_consultores_tarefas')
      .update({ concluido, concluido_em })
      .eq('id', tarefa.id)
    if (error) alert(`Erro ao atualizar tarefa: ${error.message}`)
  }

  async function editarTexto(reuniaoId: string, tarefaId: string, texto: string) {
    const item = itens.find((i) => i.reuniao.id === reuniaoId)
    const tarefa = item?.tarefas.find((t) => t.id === tarefaId)
    if (!tarefa || tarefa.texto === texto) return
    atualizarTarefasLocal(
      reuniaoId,
      (item?.tarefas ?? []).map((t) => (t.id === tarefaId ? { ...t, texto } : t))
    )
    const { error } = await supabase.from('reunioes_consultores_tarefas').update({ texto }).eq('id', tarefaId)
    if (error) alert(`Erro ao salvar tarefa: ${error.message}`)
  }

  async function editarResponsavel(reuniaoId: string, tarefaId: string, responsavel: string) {
    const item = itens.find((i) => i.reuniao.id === reuniaoId)
    const tarefa = item?.tarefas.find((t) => t.id === tarefaId)
    const valor = responsavel.trim() || null
    if (!tarefa || tarefa.responsavel === valor) return
    atualizarTarefasLocal(
      reuniaoId,
      (item?.tarefas ?? []).map((t) => (t.id === tarefaId ? { ...t, responsavel: valor } : t))
    )
    const { error } = await supabase
      .from('reunioes_consultores_tarefas')
      .update({ responsavel: valor })
      .eq('id', tarefaId)
    if (error) alert(`Erro ao salvar responsável: ${error.message}`)
  }

  async function excluirTarefa(reuniaoId: string, tarefaId: string) {
    const item = itens.find((i) => i.reuniao.id === reuniaoId)
    atualizarTarefasLocal(reuniaoId, (item?.tarefas ?? []).filter((t) => t.id !== tarefaId))
    const { error } = await supabase.from('reunioes_consultores_tarefas').delete().eq('id', tarefaId)
    if (error) alert(`Erro ao excluir tarefa: ${error.message}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reunião Consultores</h1>
          <p className="text-sm text-gray-500">Ata e lista de tarefas da reunião semanal com a diretoria.</p>
        </div>
        {isEditor && (
          <button
            onClick={novaReuniao}
            disabled={criando}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {criando ? 'Criando...' : '+ Nova reunião'}
          </button>
        )}
      </div>

      {itens.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">Nenhuma reunião registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {itens.map(({ reuniao, tarefas }) => {
            const concluidas = tarefas.filter((t) => t.concluido).length
            const progresso = tarefas.length ? Math.round((concluidas / tarefas.length) * 100) : 0
            return (
              <div key={reuniao.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {isEditor ? (
                      <input
                        key={`titulo-${reuniao.id}`}
                        defaultValue={reuniao.titulo}
                        onBlur={(e) => salvarCampo(reuniao.id, 'titulo', e.target.value)}
                        className="min-w-[12rem] rounded border border-transparent bg-transparent px-1 py-0.5 text-lg font-semibold text-gray-900 hover:border-gray-300 focus:border-teal-400 focus:bg-white focus:outline-none"
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{reuniao.titulo}</p>
                    )}
                    {isEditor ? (
                      <input
                        type="date"
                        key={`data-${reuniao.id}`}
                        defaultValue={reuniao.data}
                        onChange={(e) => salvarCampo(reuniao.id, 'data', e.target.value)}
                        className="w-fit rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-gray-500 hover:border-gray-300 focus:border-teal-400 focus:bg-white focus:outline-none"
                      />
                    ) : (
                      <p className="px-1 text-xs text-gray-500">{formatarData(reuniao.data)}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => emitirAtaConsultores(reuniao, tarefas)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      ⬇ Baixar PDF
                    </button>
                    {isEditor && (
                      <button
                        onClick={() => excluirReuniao(reuniao.id)}
                        className="text-gray-400 hover:text-red-600"
                        aria-label="Excluir reunião"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Participantes
                  </p>
                  {isEditor ? (
                    <textarea
                      key={`participantes-${reuniao.id}`}
                      defaultValue={reuniao.participantes ?? ''}
                      onBlur={(e) => salvarCampo(reuniao.id, 'participantes', e.target.value)}
                      placeholder="Nomes e cargos..."
                      rows={1}
                      className="w-full resize-none rounded-md border border-transparent px-1.5 py-1 text-sm text-gray-700 transition-colors hover:border-gray-200 focus:border-gray-300 focus:outline-none"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap px-1.5 text-sm text-gray-700">
                      {reuniao.participantes || '—'}
                    </p>
                  )}
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">Ata</p>
                  <RichTextEditor
                    value={reuniao.pauta ?? ''}
                    editable={isEditor}
                    mostrarBarra={isEditor}
                    placeholder={isEditor ? 'Pauta e observações da reunião...' : undefined}
                    onBlur={(html) => salvarCampo(reuniao.id, 'pauta', html)}
                  />
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Tarefas</p>
                    {tarefas.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {concluidas}/{tarefas.length} concluídas
                      </p>
                    )}
                  </div>

                  {tarefas.length > 0 && (
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  )}

                  <ul className="flex flex-col gap-1.5">
                    {tarefas.map((tarefa) => (
                      <li
                        key={tarefa.id}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={tarefa.concluido}
                          disabled={!isEditor}
                          onChange={() => alternarTarefa(reuniao.id, tarefa)}
                          className="h-4 w-4 shrink-0 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        {isEditor ? (
                          <input
                            key={`texto-${tarefa.id}`}
                            defaultValue={tarefa.texto}
                            onBlur={(e) => editarTexto(reuniao.id, tarefa.id, e.target.value)}
                            className={clsx(
                              'min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm focus:border-gray-300 focus:bg-white focus:outline-none',
                              tarefa.concluido ? 'text-gray-400 line-through' : 'text-gray-800'
                            )}
                          />
                        ) : (
                          <span
                            className={clsx(
                              'min-w-0 flex-1 px-1 text-sm',
                              tarefa.concluido ? 'text-gray-400 line-through' : 'text-gray-800'
                            )}
                          >
                            {tarefa.texto}
                          </span>
                        )}
                        {isEditor ? (
                          <input
                            key={`resp-${tarefa.id}`}
                            defaultValue={tarefa.responsavel ?? ''}
                            onBlur={(e) => editarResponsavel(reuniao.id, tarefa.id, e.target.value)}
                            placeholder="Responsável"
                            className="w-32 shrink-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-gray-500 focus:border-gray-300 focus:bg-white focus:outline-none"
                          />
                        ) : (
                          tarefa.responsavel && (
                            <span className="shrink-0 text-xs text-gray-400">{tarefa.responsavel}</span>
                          )
                        )}
                        {isEditor && (
                          <button
                            onClick={() => excluirTarefa(reuniao.id, tarefa.id)}
                            className="shrink-0 text-gray-300 hover:text-red-600"
                            aria-label="Excluir tarefa"
                          >
                            ✕
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {isEditor && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        adicionarTarefa(reuniao.id)
                      }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        value={novaTarefaTexto[reuniao.id] ?? ''}
                        onChange={(e) =>
                          setNovaTarefaTexto((prev) => ({ ...prev, [reuniao.id]: e.target.value }))
                        }
                        placeholder="+ Adicionar tarefa..."
                        className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Adicionar
                      </button>
                    </form>
                  )}

                  {tarefas.length === 0 && !isEditor && (
                    <p className="py-2 text-sm text-gray-400">Nenhuma tarefa registrada.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
