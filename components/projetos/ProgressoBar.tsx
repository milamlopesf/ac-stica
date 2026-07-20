export function ProgressoBar({
  concluidas,
  total,
  compacto = false,
  className,
}: {
  concluidas: number
  total: number
  compacto?: boolean
  className?: string
}) {
  if (total === 0) return null

  const percentual = Math.round((concluidas / total) * 100)

  if (compacto) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${percentual}%` }}
            />
          </div>
          <span className="whitespace-nowrap text-xs text-gray-500">
            {concluidas}/{total} ({percentual}%)
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>Progresso</span>
        <span className="font-medium text-gray-700">
          {concluidas}/{total} ({percentual}%)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}
