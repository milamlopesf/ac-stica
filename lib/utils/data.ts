export function formatarData(data: string | null | undefined): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('-')
  if (!ano || !mes || !dia) return data
  return `${dia}/${mes}/${ano}`
}

export function paraInputDate(data: string | null | undefined): string {
  return data ?? ''
}
