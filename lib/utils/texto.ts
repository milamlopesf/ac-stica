export function htmlEstaVazio(html: string) {
  return html.replace(/<[^>]*>/g, '').trim().length === 0
}

export function textoSimples(html: string) {
  return html
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
