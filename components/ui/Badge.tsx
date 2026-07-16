import clsx from 'clsx'

export function Badge({
  label,
  className,
}: {
  label: string
  className: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        className
      )}
    >
      {label}
    </span>
  )
}
