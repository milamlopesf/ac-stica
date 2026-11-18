// Extração do export do WhatsApp (zip, ou .txt + fotos soltos) e preparo das
// fotos para embutir na planilha: corrige a orientação EXIF, reduz o
// tamanho (lado maior até 560px) e gera o par base64 + dimensões de exibição
// (lado maior até 140px, igual à planilha gerada manualmente).

const EXTENSOES_IMAGEM = /\.(jpe?g|png|webp|heic)$/i

export type ArquivosVistoria = {
  texto: string
  fotos: Map<string, Blob>
}

function nomeBase(caminho: string): string {
  const partes = caminho.split('/')
  return partes[partes.length - 1]
}

export async function extrairArquivosVistoria(arquivos: File[]): Promise<ArquivosVistoria> {
  const zip = arquivos.find((a) => a.name.toLowerCase().endsWith('.zip'))

  if (zip) {
    const JSZip = (await import('jszip')).default
    const pacote = await JSZip.loadAsync(zip)
    const entradas = Object.values(pacote.files).filter((f) => !f.dir)

    const entradaTxt = entradas.find((f) => f.name.toLowerCase().endsWith('.txt'))
    if (!entradaTxt) {
      throw new Error('Não encontrei o arquivo .txt da conversa dentro do .zip.')
    }
    const texto = await entradaTxt.async('string')

    const fotos = new Map<string, Blob>()
    for (const entrada of entradas) {
      if (!EXTENSOES_IMAGEM.test(entrada.name)) continue
      const blob = await entrada.async('blob')
      fotos.set(nomeBase(entrada.name), blob)
    }
    return { texto, fotos }
  }

  const arquivoTxt = arquivos.find((a) => a.name.toLowerCase().endsWith('.txt'))
  if (!arquivoTxt) {
    throw new Error('Selecione o .zip exportado do WhatsApp, ou o .txt da conversa junto com as fotos.')
  }
  const texto = await arquivoTxt.text()

  const fotos = new Map<string, Blob>()
  for (const arquivo of arquivos) {
    if (arquivo === arquivoTxt) continue
    if (!EXTENSOES_IMAGEM.test(arquivo.name)) continue
    fotos.set(nomeBase(arquivo.name), arquivo)
  }
  return { texto, fotos }
}

function blobParaBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] ?? '')
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsDataURL(blob)
  })
}

export type FotoPreparada = {
  base64: string
  larguraExibicao: number
  alturaExibicao: number
}

const LADO_MAX_ARQUIVO = 560
const LADO_MAX_EXIBICAO = 140

export async function prepararFotoVistoria(blob: Blob): Promise<FotoPreparada | null> {
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    const { width: w, height: h } = bitmap

    const canvas = document.createElement('canvas')
    const escalaArquivo = Math.min(1, LADO_MAX_ARQUIVO / Math.max(w, h))
    canvas.width = Math.max(1, Math.round(w * escalaArquivo))
    canvas.height = Math.max(1, Math.round(h * escalaArquivo))
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return null
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blobReduzido = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
    )
    if (!blobReduzido) return null

    const base64 = await blobParaBase64(blobReduzido)
    const escalaExibicao = LADO_MAX_EXIBICAO / Math.max(w, h)

    return {
      base64,
      larguraExibicao: Math.max(1, Math.round(w * escalaExibicao)),
      alturaExibicao: Math.max(1, Math.round(h * escalaExibicao)),
    }
  } catch {
    return null
  }
}
