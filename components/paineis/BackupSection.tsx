'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function baixarArquivo(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function dataDeHoje() {
  return new Date().toISOString().slice(0, 10)
}

export function BackupSection() {
  const supabase = createClient()
  const [gerandoJson, setGerandoJson] = useState(false)
  const [gerandoExcel, setGerandoExcel] = useState(false)
  const [erro, setErro] = useState('')

  async function baixarBackupCompleto() {
    setGerandoJson(true)
    setErro('')

    const [projetos, atividades, notas, reunioes, anexos, biblioteca] = await Promise.all([
      supabase.from('projetos').select('*'),
      supabase.from('atividades').select('*'),
      supabase.from('notas').select('*'),
      supabase.from('reunioes').select('*'),
      supabase.from('anexos').select('*'),
      supabase.from('biblioteca').select('*'),
    ])

    setGerandoJson(false)

    const primeiroErro = [projetos, atividades, notas, reunioes, anexos, biblioteca].find(
      (r) => r.error
    )?.error
    if (primeiroErro) {
      setErro(`Erro ao gerar backup: ${primeiroErro.message}`)
      return
    }

    const backup = {
      exportado_em: new Date().toISOString(),
      projetos: projetos.data,
      atividades: atividades.data,
      notas: notas.data,
      reunioes: reunioes.data,
      anexos: anexos.data,
      biblioteca: biblioteca.data,
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    baixarArquivo(blob, `backup-painel-acustica-${dataDeHoje()}.json`)
  }

  async function baixarProjetosExcel() {
    setGerandoExcel(true)
    setErro('')

    const { data: projetos, error } = await supabase
      .from('projetos')
      .select('*')
      .order('nome', { ascending: true })

    if (error) {
      setGerandoExcel(false)
      setErro(`Erro ao gerar planilha: ${error.message}`)
      return
    }

    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const planilha = workbook.addWorksheet('Projetos')

    planilha.columns = [
      { header: 'Nome', key: 'nome', width: 32 },
      { header: 'Etapa', key: 'etapa', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Entrega', key: 'entrega', width: 14 },
      { header: 'Responsável', key: 'responsavel', width: 22 },
      { header: 'Projetista Acústico', key: 'projetista', width: 22 },
    ]
    planilha.getRow(1).font = { bold: true }

    for (const p of projetos ?? []) {
      planilha.addRow({
        nome: p.nome,
        etapa: p.etapa,
        status: p.status,
        entrega: p.entrega ?? '',
        responsavel: p.responsavel ?? '',
        projetista: p.projetista ?? '',
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    setGerandoExcel(false)
    baixarArquivo(blob, `projetos-${dataDeHoje()}.xlsx`)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Backup de dados</h2>
      <p className="mb-4 text-sm text-gray-500">
        Baixe uma cópia dos dados do painel. O backup completo não inclui os arquivos PDF/Excel em
        si (apenas nome e tamanho de cada anexo) — para baixar um arquivo específico, use a aba do
        projeto ou da biblioteca de documentos.
      </p>

      {erro && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={baixarBackupCompleto}
          disabled={gerandoJson}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {gerandoJson ? 'Gerando...' : '⬇ Backup completo (JSON)'}
        </button>
        <button
          onClick={baixarProjetosExcel}
          disabled={gerandoExcel}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {gerandoExcel ? 'Gerando...' : '⬇ Projetos (Excel)'}
        </button>
      </div>
    </div>
  )
}
