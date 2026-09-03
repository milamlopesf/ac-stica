'use client'

import { useState } from 'react'
import { LISTA_COBERTURA, type ProjetoCobertura } from '@/lib/data/listaCobertura'
import { CLASSE_STATUS_COBERTURA, LABEL_STATUS_COBERTURA } from '@/lib/utils/cobertura'
import { Badge } from '@/components/ui/Badge'

function exportarCsv(linhas: ProjetoCobertura[]) {
  const cabecalho = ['Referência', 'Projeto', 'Diretor', 'Contratado (acústica)', 'Acompanhamento interno']
  const linhasCsv = linhas.map((l) => [
    l.ref,
    l.proj,
    l.dir,
    LABEL_STATUS_COBERTURA[l.contratado],
    LABEL_STATUS_COBERTURA[l.acompanhamento],
  ])
  const csv = [cabecalho, ...linhasCsv]
    .map((linha) => linha.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cobertura_acustica.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function CoberturaClient() {
  const [busca, setBusca] = useState('')
  const [filtroDiretor, setFiltroDiretor] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'' | 'sim' | 'nao'>('')

  const diretores = Array.from(new Set(LISTA_COBERTURA.map((p) => p.dir))).sort()

  const linhasFiltradas = LISTA_COBERTURA.filter((l) => {
    if (busca) {
      const q = busca.toLowerCase()
      if (!l.proj.toLowerCase().includes(q) && !l.ref.toLowerCase().includes(q)) return false
    }
    if (filtroDiretor && l.dir !== filtroDiretor) return false
    if (filtroStatus && l.contratado !== filtroStatus) return false
    return true
  })

  const totalContratadoSim = LISTA_COBERTURA.filter((l) => l.contratado === 'sim').length
  const totalAcompanhamentoSim = LISTA_COBERTURA.filter((l) => l.acompanhamento === 'sim').length

  const porDiretor = diretores.map((dir) => {
    const lista = LISTA_COBERTURA.filter((l) => l.dir === dir)
    const n = lista.length
    const cSim = lista.filter((l) => l.contratado === 'sim').length
    const aSim = lista.filter((l) => l.acompanhamento === 'sim').length
    const pctC = n ? (cSim / n) * 100 : 0
    const pctA = n ? (aSim / n) * 100 : 0
    const pct = Math.round(((pctC + pctA) / 2) * 10) / 10
    return { dir, n, pct }
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">
            Consultoria técnica · Cobertura de processos
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">Painel de Cobertura — Acústica</h1>
        </div>
        <button
          onClick={() => exportarCsv(LISTA_COBERTURA)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ↓ Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border-l-4 border-l-gray-500 border-y border-r border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-gray-900">{LISTA_COBERTURA.length}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500 uppercase">Projetos em desenvolvimento</p>
        </div>
        <div className="rounded-lg border-l-4 border-l-green-500 border-y border-r border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-green-600">{totalContratadoSim}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500 uppercase">
            Projeto técnico de acústica contratado
          </p>
        </div>
        <div className="rounded-lg border-l-4 border-l-teal-500 border-y border-r border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-teal-600">{totalAcompanhamentoSim}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500 uppercase">
            Acompanhamento interno de consultoria de acústica
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
          Grau de abrangência por diretor
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {porDiretor.map((d) => (
            <div
              key={d.dir}
              className="min-w-[130px] flex-1 shrink-0 rounded-md border-l-[3px] border-l-teal-500 border-y border-r border-gray-200 bg-white px-3 py-2.5"
            >
              <p className="text-lg font-bold text-gray-900">{d.pct}%</p>
              <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-800" title={d.dir}>
                {d.dir}
              </p>
              <p className="text-[10.5px] text-gray-400">{d.n} projetos</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Projetos em Desenvolvimento</h2>
            <p className="text-xs text-gray-500">
              {linhasFiltradas.length} de {LISTA_COBERTURA.length} projetos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar projeto ou referência..."
              className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
            <select
              value={filtroDiretor}
              onChange={(e) => setFiltroDiretor(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="">Todos os diretores</option>
              {diretores.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="">Todos os status</option>
              <option value="sim">Contratado = Sim</option>
              <option value="nao">Contratado = Não</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                <th className="px-4 py-2.5">Referência</th>
                <th className="px-4 py-2.5">Projeto</th>
                <th className="px-4 py-2.5">Diretor</th>
                <th className="px-4 py-2.5">Contratado (acústica)</th>
                <th className="px-4 py-2.5">Acompanhamento interno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {linhasFiltradas.map((l) => (
                <tr key={l.ref} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{l.ref}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900">{l.proj}</td>
                  <td className="px-4 py-2.5 text-gray-600">{l.dir}</td>
                  <td className="px-4 py-2.5">
                    <Badge
                      label={LABEL_STATUS_COBERTURA[l.contratado]}
                      className={CLASSE_STATUS_COBERTURA[l.contratado]}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge
                      label={LABEL_STATUS_COBERTURA[l.acompanhamento]}
                      className={CLASSE_STATUS_COBERTURA[l.acompanhamento]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
