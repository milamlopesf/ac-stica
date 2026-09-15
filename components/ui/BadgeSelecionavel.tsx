'use client'

import clsx from 'clsx'
import { Badge } from './Badge'

interface CorConfig {
  label: string
  badge: string
}

export function BadgeSelecionavel<T extends string>({
  valor,
  opcoes,
  cores,
  isEditor,
  onSelecionar,
}: {
  valor: T
  opcoes: readonly T[]
  cores: Record<T, CorConfig>
  isEditor: boolean
  onSelecionar: (novoValor: T) => void
}) {
  if (!isEditor) {
    return <Badge label={cores[valor].label} className={cores[valor].badge} />
  }

  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="inline-block"
    >
      <select
        value={valor}
        onChange={(e) => onSelecionar(e.target.value as T)}
        title="Clique para alterar"
        className={clsx(
          'cursor-pointer appearance-none rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-400',
          cores[valor].badge
        )}
      >
        {opcoes.map((o) => (
          <option key={o} value={o} className="bg-white text-gray-900">
            {cores[o].label}
          </option>
        ))}
      </select>
    </span>
  )
}
