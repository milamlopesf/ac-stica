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

/**
 * Converte HTML em texto simples preservando quebras entre parágrafos/itens
 * e decodificando entidades (&nbsp;, &amp;, ...). Usado em relatórios, onde
 * a formatação em blocos precisa continuar legível.
 */
export function textoComQuebras(html: string) {
  const comQuebras = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, '')

  let decodificado = comQuebras
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = comQuebras
    decodificado = textarea.value
  }

  return decodificado
    .split('\n')
    .map((linha) => linha.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
