import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'
import { formatarData } from '@/lib/utils/data'
import { Badge } from '@/components/ui/Badge'

export function ProjetoCard({ projeto, onClick }: { projeto: Projeto; onClick: () => void }) {
  const corEtapa = CORES_ETAPA[projeto.etapa]
  const corStatus = CORES_STATUS[projeto.status]

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-medium text-gray-900">{projeto.nome}</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge label={corEtapa.label} className={corEtapa.badge} />
        <Badge label={corStatus.label} className={corStatus.badge} />
      </div>

      <dl className="mt-1 flex flex-col gap-1 text-xs text-gray-500">
        <div className="flex justify-between">
          <dt>Entrega</dt>
          <dd className="font-medium text-gray-700">{formatarData(projeto.entrega)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Diretor</dt>
          <dd className="font-medium text-gray-700">{projeto.diretor || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Gerente</dt>
          <dd className="font-medium text-gray-700">{projeto.gerente || '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Projetista acústico</dt>
          <dd className="font-medium text-gray-700">{projeto.projetista || '—'}</dd>
        </div>
      </dl>
    </button>
  )
}
