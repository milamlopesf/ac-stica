import { FotoStorageThumb } from '@/components/ui/FotoStorageThumb'

export function FotoPessoaThumb({
  caminho,
  nome,
  className,
}: {
  caminho: string | null
  nome?: string
  className?: string
}) {
  return (
    <FotoStorageThumb
      bucket="fotos-equipe"
      caminho={caminho}
      alt={nome ? `Foto de ${nome}` : 'Foto'}
      className={className ?? 'h-6 w-6 shrink-0 rounded-full object-cover'}
    />
  )
}
