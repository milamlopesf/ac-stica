'use client'

import { useState } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'
import { formatarData } from '@/lib/utils/data'
import { Badge } from '@/components/ui/Badge'
import { ProgressoBar } from './ProgressoBar'
import { ProjetoFormModal } from './ProjetoFormModal'
import { AnotacoesTab } from './tabs/AnotacoesTab'
import { ReunioesTab } from './tabs/ReunioesTab'
import { AtividadesTab } from './tabs/AtividadesTab'
import { AnexosTab } from './tabs/AnexosTab'

type Aba = 'anotacoes' | 'reunioes' | 'atividades' | 'anexos'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'anotacoes', label: 'Anotações' },
  { id: 'reunioes', label: 'Atas de Reunião' },
  { id: 'atividades', label: 'Atividades' },
  { id: 'anexos', label: 'Anexos' },
]

export function ProjetoDetalhePanel({
  projeto,
  isEditor,
  gerentesExistentes = [],
  progresso,
  onFechar,
  onAtualizado,
  onExcluido,
}: {
  projeto: Projeto
  isEditor: boolean
  gerentesExistentes?: string[]
  progresso?: { concluidas: number; total: number }
  onFechar: () => void
  onAtualizado: (p: Projeto) => void
  onExcluido: (id: string) => void
}) {
  const supabase = createClient()
  const [aba, setAba] = useState<Aba>('anotacoes')
  const [editando, setEditando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const corEtapa = CORES_ETAPA[projeto.etapa]
  const corStatus = CORES_STATUS[projeto.status]

  async function handleExcluir() {
    if (!confirm(`Excluir o projeto "${projeto.nome}"? Essa ação não pode ser desfeita.`)) return
    setExcluindo(true)
    const { error } = await supabase.from('projetos').delete().eq('id', projeto.id)
    setExcluindo(false)
    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
      return
    }
    onExcluido(projeto.id)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-gray-900">{projeto.nome}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge label={corEtapa.label} className={corEtapa.badge} />
              <Badge label={corStatus.label} className={corStatus.badge} />
            </div>
            {progresso && (
              <ProgressoBar concluidas={progresso.concluidas} total={progresso.total} className="max-w-xs" />
            )}
            <dl className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-500">
              <div>
                <dt className="inline">Entrega: </dt>
                <dd className="inline font-medium text-gray-700">{formatarData(projeto.entrega)}</dd>
              </div>
              <div>
                <dt className="inline">Diretor: </dt>
                <dd className="inline font-medium text-gray-700">{projeto.diretor || '—'}</dd>
              </div>
              <div>
                <dt className="inline">Gerente: </dt>
                <dd className="inline font-medium text-gray-700">{projeto.gerente || '—'}</dd>
              </div>
              <div>
                <dt className="inline">Projetista: </dt>
                <dd className="inline font-medium text-gray-700">{projeto.projetista || '—'}</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={onFechar}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {isEditor && (
          <div className="flex gap-2 border-b border-gray-200 px-5 py-3">
            <button
              onClick={() => setEditando(true)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Editar Projeto
            </button>
            <button
              onClick={handleExcluir}
              disabled={excluindo}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {excluindo ? 'Excluindo...' : 'Excluir Projeto'}
            </button>
          </div>
        )}

        <div className="flex gap-1 border-b border-gray-200 px-5">
          {ABAS.map((t) => (
            <button
              key={t.id}
              onClick={() => setAba(t.id)}
              className={clsx(
                'border-b-2 px-3 py-2.5 text-sm font-medium',
                aba === t.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-5">
          {aba === 'anotacoes' && <AnotacoesTab projetoId={projeto.id} isEditor={isEditor} />}
          {aba === 'reunioes' && <ReunioesTab projetoId={projeto.id} isEditor={isEditor} />}
          {aba === 'atividades' && <AtividadesTab projetoId={projeto.id} isEditor={isEditor} />}
          {aba === 'anexos' && <AnexosTab projetoId={projeto.id} isEditor={isEditor} />}
        </div>
      </div>

      {editando && (
        <ProjetoFormModal
          projeto={projeto}
          gerentesExistentes={gerentesExistentes}
          onFechar={() => setEditando(false)}
          onSalvo={(p) => {
            onAtualizado(p)
            setEditando(false)
          }}
        />
      )}
    </div>
  )
}
