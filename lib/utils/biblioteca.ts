import type { CategoriaBiblioteca } from '@/lib/types/database'

export const CATEGORIAS_BIBLIOTECA: Record<CategoriaBiblioteca, { titulo: string; rota: string }> = {
  normas: { titulo: 'Normas/Manuais', rota: '/normas' },
  planilhas: { titulo: 'Planilhas de Cálculo', rota: '/planilhas' },
  laudos: { titulo: 'Laudos/Medições', rota: '/laudos' },
}

export const TIPOS_ARQUIVO_ACEITOS =
  '.pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export function extensaoValida(nomeArquivo: string) {
  return /\.(pdf|xls|xlsx)$/i.test(nomeArquivo)
}
