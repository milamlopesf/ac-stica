'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Atividade, Etapa, Prioridade, StatusAtividade, Projeto } from '@/lib/types/database'
import { ETAPAS, PRIORIDADES, STATUS_ATIVIDADE, CORES_PRIORIDADE } from '@/lib/utils/cores'

export function AtividadeRow({
  atividade,
  isEditor,
  projetos,
  onAtualizada,
  onExcluida,
}: {
  atividade: Atividade
  isEditor: boolean
  projetos?: Projeto[]
  onAtualizada: (a: Atividade) => void
  onExcluida: (id: string) => void
}) {
  const supabase = createClient()
  const [salvando, setSalvando] = useState(false)

  async function atualizarCampo<K extends keyof Atividade>(campo: K, valor: Atividade[K]) {
    setSalvando(true)
    const patch = { [campo]: valor } as Partial<Omit<Atividade, 'id' | 'created_at'>>
    const { data, error } = await supabase
      .from('atividades')
      .update(patch)
      .eq('id', atividade.id)
      .select()
      .single()
    setSalvando(false)
    if (error) {
      alert(`Erro ao salvar: ${error.message}`)
      return
    }
    onAtualizada(data as Atividade)
  }

  async function excluir() {
    if (!confirm(`Excluir a atividade "${atividade.texto}"?`)) return
    const { error } = await supabase.from('atividades').delete().eq('id', atividade.id)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    onExcluida(atividade.id)
  }

  const corPrioridade = atividade.prioridade ? CORES_PRIORIDADE[atividade.prioridade] : null

  return (
    <div className="flex flex-col gap-2 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-3">
      <input
        type="checkbox"
        checked={atividade.status === 'concluido'}
        disabled={!isEditor}
        onChange={(e) =>
          atualizarCampo('status', (e.target.checked ? 'concluido' : 'pendente') as StatusAtividade)
        }
        className="h-4 w-4 shrink-0 rounded border-gray-300"
      />

      <input
        value={atividade.texto}
        disabled={!isEditor}
        onChange={(e) => onAtualizada({ ...atividade, texto: e.target.value })}
        onBlur={(e) => atualizarCampo('texto', e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm hover:border-gray-200 focus:border-blue-400 focus:outline-none disabled:bg-transparent"
      />

      {isEditor ? (
        <select
          value={atividade.status}
          onChange={(e) => atualizarCampo('status', e.target.value as StatusAtividade)}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs"
        >
          {STATUS_ATIVIDADE.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : null}

      {projetos && (
        <select
          value={atividade.projeto_id ?? ''}
          disabled={!isEditor}
          onChange={(e) => atualizarCampo('projeto_id', e.target.value || null)}
          className="w-40 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
        >
          <option value="">Sem projeto</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      )}

      <select
        value={atividade.etapa ?? ''}
        disabled={!isEditor}
        onChange={(e) => atualizarCampo('etapa', (e.target.value || null) as Etapa | null)}
        className="w-24 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
      >
        <option value="">Etapa</option>
        {ETAPAS.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>

      <select
        value={atividade.prioridade ?? ''}
        disabled={!isEditor}
        onChange={(e) => atualizarCampo('prioridade', (e.target.value || null) as Prioridade | null)}
        className="w-24 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
        style={corPrioridade ? { color: corPrioridade.hex } : undefined}
      >
        <option value="">Prioridade</option>
        {PRIORIDADES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={atividade.data_vencimento ?? ''}
        disabled={!isEditor}
        onChange={(e) => atualizarCampo('data_vencimento', e.target.value || null)}
        className="w-36 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
      />

      <input
        value={atividade.responsavel ?? ''}
        disabled={!isEditor}
        placeholder="Responsável"
        onChange={(e) => onAtualizada({ ...atividade, responsavel: e.target.value })}
        onBlur={(e) => atualizarCampo('responsavel', e.target.value || null)}
        className="w-28 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
      />

      <input
        value={atividade.projetista ?? ''}
        disabled={!isEditor}
        placeholder="Projetista"
        onChange={(e) => onAtualizada({ ...atividade, projetista: e.target.value })}
        onBlur={(e) => atualizarCampo('projetista', e.target.value || null)}
        className="w-28 shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs disabled:border-transparent disabled:bg-transparent"
      />

      <div className="flex w-32 shrink-0 items-center gap-2">
        <input
          type="range"
          min={0}
          max={100}
          value={atividade.progresso}
          disabled={!isEditor}
          onChange={(e) => onAtualizada({ ...atividade, progresso: Number(e.target.value) })}
          onMouseUp={(e) => atualizarCampo('progresso', Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => atualizarCampo('progresso', Number((e.target as HTMLInputElement).value))}
          className="w-full"
        />
        <span className="w-9 text-right text-xs text-gray-500">{atividade.progresso}%</span>
      </div>

      {isEditor && (
        <button
          onClick={excluir}
          disabled={salvando}
          className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Excluir atividade"
        >
          ✕
        </button>
      )}
    </div>
  )
}
