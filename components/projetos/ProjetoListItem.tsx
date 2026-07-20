import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'
import { formatarData } from '@/lib/utils/data'
import { Badge } from '@/components/ui/Badge'

export function ProjetoListItem({ projeto, onClick }: { projeto: Projeto; onClick: () => void }) {
  const corEtapa = CORES_ETAPA[projeto.etapa]
  const corStatus = CORES_STATUS[projeto.status]

  return (
    <button
      onClick={onClick}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md sm:flex-nowrap"
    >
      <h3 className="min-w-0 flex-1 truncate font-medium text-gray-900" title={projeto.nome}>
        {projeto.nome}
      </h3>

      <div className="flex shrink-0 flex-wrap gap-2">
        <Badge label={corEtapa.label} className={corEtapa.badge} />
        <Badge label={corStatus.label} className={corStatus.badge} />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:w-auto">
        <span>
          Entrega: <span className="font-medium text-gray-700">{formatarData(projeto.entrega)}</span>
        </span>
        <span className="hidden md:inline">
          Responsável: <span className="font-medium text-gray-700">{projeto.responsavel || '—'}</span>
        </span>
        <span className="hidden lg:inline">
          Projetista: <span className="font-medium text-gray-700">{projeto.projetista || '—'}</span>
        </span>
      </div>
    </button>
  )
}
