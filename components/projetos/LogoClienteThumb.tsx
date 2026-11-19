import { FotoStorageThumb } from '@/components/ui/FotoStorageThumb'

export function LogoClienteThumb({ caminho, className }: { caminho: string | null; className?: string }) {
  return (
    <FotoStorageThumb
      bucket="logos-clientes"
      caminho={caminho}
      alt="Logo do cliente"
      className={className ?? 'h-8 w-8 shrink-0 rounded object-contain'}
    />
  )
}
