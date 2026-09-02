import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'
import { formatarData } from '@/lib/utils/data'
import { emitirRelatorioProjeto } from '@/lib/utils/relatorio'
import { Badge } from '@/components/ui/Badge'
import { IconVinculo } from '@/components/ui/IconVinculo'
import { IconRelatorio } from '@/components/ui/IconRelatorio'

// Mesma definição de colunas usada no cabeçalho e em cada linha, pra ficar
// tudo alinhado. Colunas com largura fixa em px, "Projeto" ocupa o resto.
export const GRID_COLUNAS =
  'grid items-center gap-x-3 ' +
  'grid-cols-[14px_minmax(0,1fr)_82px_160px_88px_24px_16px] ' +
  'md:grid-cols-[14px_minmax(0,1fr)_82px_160px_88px_128px_128px_24px_16px] ' +
  'lg:grid-cols-[14px_minmax(0,1fr)_82px_160px_88px_128px_128px_112px_24px_16px]'

export function ProjetosListaHeader() {
  return (
    <div
      className={
        GRID_COLUNAS +
        ' border-b border-gray-200 px-4 pb-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase'
      }
    >
      <span />
      <span>Projeto</span>
      <span>Etapa</span>
      <span>Status</span>
      <span>Entrega</span>
      <span className="hidden md:inline">Diretor</span>
      <span className="hidden md:inline">Gerente</span>
      <span className="hidden lg:inline">Projetista</span>
      <span />
      <span />
    </div>
  )
}

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
      className={
        GRID_COLUNAS +
        ' cursor-pointer px-4 py-3 text-left transition hover:bg-gray-50'
      }
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: corStatus.hex }}
        title={corStatus.label}
      />

      <span className="flex min-w-0 items-center gap-1.5">
        <h3 className="min-w-0 truncate font-medium text-gray-900" title={projeto.nome}>
          {projeto.nome}
        </h3>
        {projeto.projeto_vinculado_id && (
          <span title={nomeVinculado ? `Vinculado a ${nomeVinculado}` : 'Vinculado'}>
            <IconVinculo className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          </span>
        )}
      </span>

      <span className="min-w-0">
        <Badge label={corEtapa.label} className={corEtapa.badge} />
      </span>
      <span className="min-w-0">
        <Badge label={corStatus.label} className={corStatus.badge} />
      </span>

      <span className="truncate text-xs text-gray-600">{formatarData(projeto.entrega)}</span>
      <span className="hidden truncate text-xs text-gray-600 md:inline" title={projeto.diretor || undefined}>
        {projeto.diretor || '—'}
      </span>
      <span className="hidden truncate text-xs text-gray-600 md:inline" title={projeto.gerente || undefined}>
        {projeto.gerente || '—'}
      </span>
      <span className="hidden truncate text-xs text-gray-600 lg:inline" title={projeto.projetista || undefined}>
        {projeto.projetista || '—'}
      </span>

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
