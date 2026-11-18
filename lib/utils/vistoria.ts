// Lê o export de conversa do WhatsApp de uma vistoria acústica e monta um
// rascunho de ocorrências no mesmo formato usado manualmente (ver skill
// "planilha-vistoria-acustica"): cada mensagem com foto + legenda vira uma
// ocorrência; fotos sem legenda são atribuídas ao item anterior do mesmo
// ambiente (ou ficam pendentes, se vierem antes de qualquer descrição).
// O resultado é só um RASCUNHO — a tela de revisão deixa o usuário corrigir
// tipo, descrição e fotos antes de gerar o arquivo final.

export type TipoItemVistoria = 'DIVISÓRIAS' | 'DRYWALL' | 'INSTALAÇÃO'

export type ItemVistoria = {
  id: string
  andar: string
  ambiente: string
  item: TipoItemVistoria
  descricao: string
  fotos: string[]
  alertas: string[]
}

export type ResultadoParseVistoria = {
  data: string
  autores: string[]
  itens: ItemVistoria[]
}

const LRM = '‎'

function stripChars(s: string, ch: string): string {
  let start = 0
  let end = s.length
  while (start < end && s[start] === ch) start++
  while (end > start && s[end - 1] === ch) end--
  return s.slice(start, end)
}

function gerarId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `item-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function titleCase(s: string): string {
  return s.replace(/\p{L}+/gu, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
}

// Android: "16/11/2026 10:28 - Nome: msg" | iPhone: "[16/11/2026, 10:28:15] Nome: msg"
const RX = /^\[?(\d{1,2}\/\d{1,2}\/\d{2,4}),? (\d{1,2}:\d{2})(?::\d{2})?\]?(?: -)? ([^:]+?): (.*)$/
const RX_SYS = /^\[?\d{1,2}\/\d{1,2}\/\d{2,4},? \d{1,2}:\d{2}/
const RX_IMG = /([\w-]+\.(?:jpe?g|png|webp|heic))/i
const RX_ANDAR = /^(\d+)\s*[ºo°⁰]?\s*(?:andar|pav)/i
const RX_AMB = /^(sala|ambiente|copa|recep|banheiro|wc|auditório|auditorio|hall|corredor)\b/i
const IGNORAR = new Set(['mensagem apagada', '<mídia oculta>', 'this message was deleted', 'mensagem editada'])

type MsgBruta = { data: string; hora: string; autor: string; linhas: string[] }

export function parseWhatsAppVistoria(
  textoChat: string,
  nomesArquivosDisponiveis: Set<string>
): ResultadoParseVistoria {
  const linhasArquivo = textoChat.split(/\r\n|\r|\n/)
  const msgsBrutas: Array<MsgBruta | null> = []
  for (const raw of linhasArquivo) {
    const linha = stripChars(raw, LRM).trim()
    const m = RX.exec(linha)
    if (m) {
      msgsBrutas.push({
        data: m[1],
        hora: m[2],
        autor: stripChars(m[3].trim(), LRM),
        linhas: [stripChars(m[4].trim(), LRM).trim()],
      })
    } else if (RX_SYS.test(linha)) {
      msgsBrutas.push(null)
    } else if (msgsBrutas.length && msgsBrutas[msgsBrutas.length - 1] !== null) {
      msgsBrutas[msgsBrutas.length - 1]!.linhas.push(linha)
    }
  }
  const msgs = msgsBrutas.filter((m): m is MsgBruta => m !== null)

  const itens: ItemVistoria[] = []
  let andar = ''
  let ambiente = ''
  let buffer: Array<[string, string]> = []
  const visitados: string[] = []
  const autores = new Set<string>()
  const datas = new Set<string>()
  const alertaRetorno: string[] = []

  function novoItem(desc: string, fotos?: string[]) {
    const it: ItemVistoria = {
      id: gerarId(),
      andar,
      ambiente,
      item: 'DIVISÓRIAS',
      descricao: desc,
      fotos: [],
      alertas: [],
    }
    if (buffer.length && buffer[0][1] === ambiente) {
      it.fotos.push(...buffer.map((b) => b[0]))
      it.alertas.push('fotos sem legenda enviadas antes da descrição')
    }
    buffer = []
    if (fotos) it.fotos.push(...fotos)
    itens.push(it)
  }

  function setAmbiente(nome: string) {
    if (nome !== ambiente && visitados.includes(nome)) alertaRetorno.push(nome)
    ambiente = nome
    if (!visitados.includes(nome)) visitados.push(nome)
  }

  for (const m of msgs) {
    autores.add(m.autor)
    datas.add(m.data)
    const linhas = m.linhas.filter((l) => l && !IGNORAR.has(l.toLowerCase()))
    if (!linhas.length) continue

    const primeira = linhas[0].toLowerCase()
    const img = primeira.includes('anexado') || primeira.includes('attached') ? RX_IMG.exec(linhas[0]) : null
    const corpo = img ? linhas.slice(1) : linhas
    const descPartes: string[] = []
    for (const l of corpo) {
      const mAndar = RX_ANDAR.exec(l)
      if (mAndar) {
        andar = `${mAndar[1]}º`
      } else if (
        RX_AMB.test(l) ||
        (l.split(/\s+/).length <= 2 && descPartes.length === 0 && /^[A-ZÀ-Ý]/.test(l) && !img && corpo.length > 1)
      ) {
        setAmbiente(RX_AMB.test(l) ? titleCase(l.trim()) : l.trim())
      } else {
        descPartes.push(l)
      }
    }
    const desc = descPartes.join(' ').trim()

    if (img) {
      const f = img[1]
      if (desc) {
        novoItem(desc, [f])
      } else if (itens.length && itens[itens.length - 1].ambiente === ambiente) {
        itens[itens.length - 1].fotos.push(f)
        itens[itens.length - 1].alertas.push(`${f} sem legenda — anexada ao item anterior`)
      } else {
        buffer.push([f, ambiente])
      }
    } else if (desc) {
      novoItem(desc)
    }

    if (alertaRetorno.length && itens.length) {
      itens[itens.length - 1].alertas.push(
        `retorno ao ambiente ${alertaRetorno.pop()} depois de outro — confirmar`
      )
    }
  }

  for (const [foto, amb] of buffer) {
    itens.push({
      id: gerarId(),
      andar,
      ambiente: amb,
      item: 'DIVISÓRIAS',
      descricao: '',
      fotos: [foto],
      alertas: ['foto sem descrição'],
    })
  }

  for (const it of itens) {
    if (!it.fotos.length) it.alertas.push('item sem foto')
    const faltando = it.fotos.filter((f) => !nomesArquivosDisponiveis.has(f))
    if (faltando.length) it.alertas.push(`arquivo(s) não encontrados no envio: ${faltando.join(', ')}`)
  }

  const datasOrdenadas = Array.from(datas).sort()

  return {
    data: datasOrdenadas[datasOrdenadas.length - 1] ?? '',
    autores: Array.from(autores).sort(),
    itens,
  }
}
