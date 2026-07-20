export function htmlEstaVazio(html: string) {
  return html.replace(/<[^>]*>/g, '').trim().length === 0
}
