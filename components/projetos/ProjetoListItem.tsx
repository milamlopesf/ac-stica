import clsx from 'clsx'
import type { Etapa, Projeto, StatusProjeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS, ETAPAS, STATUS_PROJETO } from '@/lib/utils/cores'
import { formatarData } from '@/lib/utils/data'
import { emitirRelatorioProjeto } from '@/lib/utils/relatorio'
import { BadgeSelecionavel } from '@/components/ui/BadgeSelecionavel'
import { IconVinculo } from '@/components/ui/IconVinculo'
import { IconRelatorio } from '@/components/ui/IconRelatorio'

// Mesma definição de colunas usada no cabeçalho e em cada linha, pra ficar
// tudo alinhado. Colunas com largura fixa em px, "Projeto" ocupa o resto.
export const GRID_COLUNAS =
  'grid items-center gap-x-3 ' +
  'grid-cols-[14px_minmax(0,1fr)_82px_160px_88px_24px_16px] ' +
  'md:grid-cols-[14px_minmax(0,1fr)_82px_160px_88px_128px_128px_24px_16px] ' +
  'lg:grid-cols-[14px_minmax(0,1fr)_82px_160px_88px_128px_128px_112px_24px_16px]'

export type ColunaOrdenavel = 'nome' | 'etapa' | 'status' | 'entrega' | 'diretor' | 'gerente' | 'projetista'

export type OrdenarPor = { campo: ColunaOrdenavel; direcao: 'asc' | 'desc' } | null

function IconOrdenar({ estado }: { estado: 'inativo' | 'asc' | 'desc' }) {
  if (estado === 'inativo') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 shrink-0 text-gray-300">
        <path d="M8 9l4-4 4 4M8 15l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3 w-3 shrink-0 text-teal-700">
      {estado === 'asc' ? (
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function BotaoCabecalho({
  label,
  campo,
  ordenarPor,
  onOrdenar,
  className,
}: {
  label: string
  campo: ColunaOrdenavel
  ordenarPor: OrdenarPor
  onOrdenar: (campo: ColunaOrdenavel) => void
  className?: string
}) {
  const ativo = ordenarPor?.campo === campo
  return (
    <button
      onClick={() => onOrdenar(campo)}
      className={clsx('flex items-center gap-1 text-left hover:text-gray-600', className)}
      title={`Ordenar por ${label.toLowerCase()}`}
    >
      {label}
      <IconOrdenar estado={ativo ? ordenarPor!.direcao : 'inativo'} />
    </button>
  )
}

export function ProjetosListaHeader({
  ordenarPor,
  onOrdenar,
}: {
  ordenarPor: OrdenarPor
  onOrdenar: (campo: ColunaOrdenavel) => void
}) {
  return (
    <div
      className={
        GRID_COLUNAS +
        ' border-b border-gray-200 px-4 pb-2 text-[11px] font-semibold tracking-wide text-gray-400 uppercase'
      }
    >
      <span />
      <BotaoCabecalho label="Projeto" campo="nome" ordenarPor={ordenarPor} onOrdenar={onOrdenar} />
      <BotaoCabecalho label="Etapa" campo="etapa" ordenarPor={ordenarPor} onOrdenar={onOrdenar} />
      <BotaoCabecalho label="Status" campo="status" ordenarPor={ordenarPor} onOrdenar={onOrdenar} />
      <BotaoCabecalho label="Entrega" campo="entrega" ordenarPor={ordenarPor} onOrdenar={onOrdenar} />
      <BotaoCabecalho
        label="Diretor"
        campo="diretor"
        ordenarPor={ordenarPor}
        onOrdenar={onOrdenar}
        className="hidden md:flex"
      />
      <BotaoCabecalho
        label="Gerente"
        campo="gerente"
        ordenarPor={ordenarPor}
        onOrdenar={onOrdenar}
        className="hidden md:flex"
      />
      <BotaoCabecalho
        label="Projetista"
        campo="projetista"
        ordenarPor={ordenarPor}
        onOrdenar={onOrdenar}
        className="hidden lg:flex"
      />
      <span />
      <span />
    </div>
  )
}

export function ProjetoListItem({
  projeto,
  nomeVinculado,
  isEditor = false,
  onClick,
  onAtualizarCampo,
}: {
  projeto: Projeto
  nomeVinculado?: string
  isEditor?: boolean
  onClick: () => void
  onAtualizarCampo?: (campo: 'etapa' | 'status', valor: string) => void
}) {
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
        <BadgeSelecionavel<Etapa>
          valor={projeto.etapa}
          opcoes={ETAPAS}
          cores={CORES_ETAPA}
          isEditor={isEditor}
          onSelecionar={(v) => onAtualizarCampo?.('etapa', v)}
        />
      </span>
      <span className="min-w-0">
        <BadgeSelecionavel<StatusProjeto>
          valor={projeto.status}
          opcoes={STATUS_PROJETO}
          cores={CORES_STATUS}
          isEditor={isEditor}
          onSelecionar={(v) => onAtualizarCampo?.('status', v)}
        />
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
