// Gera a planilha no formato do modelo AW de inspeção acústica (4738.25):
// aba única "AWCHECK_InspecoesDetalhado", cabeçalho fixo na linha 4, uma
// linha por ocorrência com as fotos empilhadas na coluna H. Layout e
// unidades (EMU, pontos) espelham o script build_vistoria.py usado
// manualmente, para o arquivo sair idêntico ao que já é gerado hoje.
import type { ItemVistoria, TipoItemVistoria } from '@/lib/utils/vistoria'
import { prepararFotoVistoria } from '@/lib/utils/vistoriaArquivos'

const GAP_EMU = 38160
const EMU_POR_PIXEL = 9525

const COR_TEAL = 'FF0F766E'
const COR_ZEBRA = 'FFF3F4F6'

const CORES_TIPO: Record<TipoItemVistoria, { fundo: string; texto: string }> = {
  DIVISÓRIAS: { fundo: 'FFCCFBF1', texto: 'FF0F766E' },
  DRYWALL: { fundo: 'FFFEF3C7', texto: 'FF92400E' },
  INSTALAÇÃO: { fundo: 'FFDBEAFE', texto: 'FF1E40AF' },
}

function parseDataBR(data: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(data.trim())
  if (!m) return null
  const dia = Number(m[1])
  const mes = Number(m[2])
  const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
  return new Date(ano, mes - 1, dia)
}

export async function gerarExcelVistoria(params: {
  itens: ItemVistoria[]
  data: string
  fotosPorNome: Map<string, Blob>
}): Promise<Blob> {
  const { itens, data, fotosPorNome } = params
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('AWCHECK_InspecoesDetalhado')

  ws.mergeCells('A1:H1')
  const titulo = ws.getCell('A1')
  titulo.value = 'Relatorio De inspeção acústica'
  titulo.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  titulo.alignment = { horizontal: 'center', vertical: 'top', wrapText: true }
  titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_TEAL } }

  ws.getRow(1).height = 30.75
  ws.getRow(3).height = 3.75
  ws.getRow(4).height = 31.5

  const larguras = [10.82, 9.27, 7.45, 11.0, 13.45, 23.27, 9.0, 42.36]
  larguras.forEach((largura, i) => {
    ws.getColumn(i + 1).width = largura
  })

  const bordaFina = { style: 'thin' } as const
  const borda = { top: bordaFina, left: bordaFina, bottom: bordaFina, right: bordaFina }

  const cabecalho = [
    'tipo',
    'status',
    'andar',
    'ambiente',
    'item',
    'descrição da ocorrência',
    'data da criação da ocorrência',
    'imagens',
  ]
  cabecalho.forEach((texto, i) => {
    const cell = ws.getCell(4, i + 1)
    cell.value = texto
    cell.font = { name: 'Calibri', size: i === 7 ? 10 : 8, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: i === 0 ? 'left' : undefined, vertical: 'top', wrapText: true }
    cell.border = borda
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_TEAL } }
  })

  const dataObj = data ? parseDataBR(data) : null
  let r = 5

  for (const it of itens) {
    const andar = it.andar ? (it.andar.endsWith('º') ? it.andar : `${it.andar}º`) : ''
    const valores: Array<string | Date | null> = [
      'Consultoria Técnica',
      'aberto',
      andar,
      it.ambiente,
      it.item,
      it.descricao,
      dataObj,
      null,
    ]
    const corTipo = CORES_TIPO[it.item]
    const zebra = (r - 5) % 2 === 1

    valores.forEach((valor, i) => {
      const cell = ws.getCell(r, i + 1)
      cell.value = valor
      cell.border = borda
      cell.alignment = { horizontal: i === 6 ? 'right' : undefined, vertical: 'top', wrapText: true }
      if (i === 4) {
        cell.font = { name: 'Calibri', size: 8, bold: true, color: { argb: corTipo.texto } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: corTipo.fundo } }
      } else {
        cell.font = { name: 'Calibri', size: 8, color: { argb: 'FF333333' } }
        if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COR_ZEBRA } }
      }
    })
    ws.getCell(r, 7).numFmt = '[$-416]dd/mm/yyyy'

    let y = GAP_EMU
    let altura = 0
    for (const nomeFoto of it.fotos) {
      const blob = fotosPorNome.get(nomeFoto)
      if (!blob) continue
      const preparada = await prepararFotoVistoria(blob)
      if (!preparada) continue

      const imageId = wb.addImage({ base64: preparada.base64, extension: 'jpeg' })
      // ExcelJS aceita em runtime um objeto simples com nativeCol/nativeRow (ver
      // lib/doc/anchor.js), mas a tipagem só expõe a classe Anchor — daí o `any`.
      ws.addImage(imageId, {
        tl: { nativeCol: 7, nativeColOff: GAP_EMU, nativeRow: r - 1, nativeRowOff: y },
        ext: { width: preparada.larguraExibicao, height: preparada.alturaExibicao },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      y += preparada.alturaExibicao * EMU_POR_PIXEL + GAP_EMU
      altura += preparada.alturaExibicao * 0.75 + 3
    }
    ws.getRow(r).height = Math.max(altura + 3, 30)
    r += 1
  }

  ws.autoFilter = `A4:H${r - 1}`
  ws.pageSetup = {
    orientation: 'portrait',
    paperSize: 9,
    fitToWidth: 1,
    fitToHeight: 0,
    fitToPage: true,
  }
  ws.pageSetup.printTitlesRow = '4:4'

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
