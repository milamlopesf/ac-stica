const MARCA_DIACRITICA_INICIO = String.fromCharCode(0x0300)
const MARCA_DIACRITICA_FIM = String.fromCharCode(0x036f)
const MARCAS_DIACRITICAS = new RegExp(`[${MARCA_DIACRITICA_INICIO}-${MARCA_DIACRITICA_FIM}]`, 'g')

export function sanitizarNomeArquivo(nome: string) {
  const semAcentos = nome.normalize('NFD').replace(MARCAS_DIACRITICAS, '')
  return semAcentos.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function formatarTamanho(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
