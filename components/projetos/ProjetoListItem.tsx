import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'
import { formatarData } from '@/lib/utils/data'
import { emitirRelatorioProjeto } from '@/lib/utils/relatorio'
import { Badge } from '@/components/ui/Badge'
import { IconVinculo } from '@/components/ui/IconVinculo'
import { IconRelatorio } from '@/components/ui/IconRelatorio'

export function ProjetoListItem({
  projeto,
  nomeVinculado,
  onClick,
}: {
  projeto: Projeto
  nomeVinculado?: string
  onClick: () => void
}) {
  const corEtapa = CORES_ETAPA[projeto.etapa]
  const corStatus = CORES_STATUS[projeto.status]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-teal-300 hover:shadow-sm sm:flex-nowrap"
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: corStatus.hex }}
        title={corStatus.label}
      />

      <h3 className="min-w-0 flex-1 truncate font-medium text-gray-900" title={projeto.nome}>
        {projeto.nome}
      </h3>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Badge label={corEtapa.label} className={corEtapa.badge} />
        <Badge label={corStatus.label} className={corStatus.badge} />
        {projeto.projeto_vinculado_id && (
          <span
            title={nomeVinculado ? `Vinculado a ${nomeVinculado}` : undefined}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            <IconVinculo className="h-3 w-3" />
            Vinculado
          </span>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:w-auto">
        <span>
          Entrega: <span className="font-medium text-gray-700">{formatarData(projeto.entrega)}</span>
        </span>
        <span className="hidden md:inline">
          Diretor: <span className="font-medium text-gray-700">{projeto.diretor || '—'}</span>
        </span>
        <span className="hidden md:inline">
          Gerente: <span className="font-medium text-gray-700">{projeto.gerente || '—'}</span>
        </span>
        <span className="hidden lg:inline">
          Projetista: <span className="font-medium text-gray-700">{projeto.projetista || '—'}</span>
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          emitirRelatorioProjeto(projeto)
        }}
        className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-teal-700"
        title="Emitir relatório"
        aria-label="Emitir relatório"
      >
        <IconRelatorio className="h-4 w-4" />
      </button>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="hidden h-4 w-4 shrink-0 text-gray-300 sm:block"
      >
        <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
