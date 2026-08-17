import type { CategoriaBiblioteca } from '@/lib/types/database'

export const CATEGORIAS_BIBLIOTECA: Record<CategoriaBiblioteca, { titulo: string; rota: string }> = {
  normas: { titulo: 'Normas/Manuais', rota: '/normas' },
  planilhas: { titulo: 'Planilhas de Cálculo', rota: '/planilhas' },
  laudos: { titulo: 'Laudos/Medições', rota: '/laudos' },
}

export const MODELOS_LAUDO = ['DPT fixa', 'DPT retrátil', 'Drywall']

export const SUBCATEGORIAS_LAUDO = ['Vedações', 'Revestimentos', 'HVAC']

export const TIPOS_ARQUIVO_ACEITOS =
  '.pdf,.xls,.xlsx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp'

export function extensaoValida(nomeArquivo: string) {
  return /\.(pdf|xls|xlsx|jpe?g|png|webp)$/i.test(nomeArquivo)
}

export function ehImagem(nomeArquivo: string) {
  return /\.(jpe?g|png|webp)$/i.test(nomeArquivo)
}
