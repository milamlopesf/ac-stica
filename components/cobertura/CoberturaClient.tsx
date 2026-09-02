'use client'

import { useMemo, useState } from 'react'
import type { Projeto } from '@/lib/types/database'
import { LISTA_COBERTURA } from '@/lib/data/listaCobertura'
import {
  calcularAcompanhamento,
  calcularContratado,
  CLASSE_STATUS_COBERTURA,
  extrairCodigo,
  LABEL_STATUS_COBERTURA,
  type StatusCobertura,
} from '@/lib/utils/cobertura'
import { Badge } from '@/components/ui/Badge'

type Linha = {
  ref: string
  proj: string
  dir: string
  projetista: string | null
  encontrado: boolean
  contratado: StatusCobertura
  acompanhamento: StatusCobertura
}

function exportarCsv(linhas: Linha[]) {
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

export function CoberturaClient({ projetos }: { projetos: Projeto[] }) {
  const [busca, setBusca] = useState('')
  const [filtroDiretor, setFiltroDiretor] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'' | 'pendente' | 'sim' | 'nao'>('')

  const porCodigo = useMemo(() => {
    const mapa = new Map<string, Projeto>()
    for (const p of projetos) {
      const codigo = extrairCodigo(p.nome)
      if (codigo) mapa.set(codigo, p)
    }
    return mapa
  }, [projetos])

  const todasAsLinhas: Linha[] = useMemo(() => {
    return LISTA_COBERTURA.map((item) => {
      const codigo = extrairCodigo(item.ref)
      const projeto = codigo ? porCodigo.get(codigo) : undefined
      const encontrado = Boolean(projeto)
      const projetista = projeto?.projetista ?? null
      return {
        ref: item.ref,
        proj: item.proj,
        dir: item.dir,
        projetista,
        encontrado,
        contratado: calcularContratado(projetista, encontrado),
        acompanhamento: calcularAcompanhamento(projetista, encontrado),
      }
    })
  }, [porCodigo])

  const diretores = useMemo(
    () => Array.from(new Set(LISTA_COBERTURA.map((p) => p.dir))).sort(),
    []
  )

  const linhasFiltradas = todasAsLinhas.filter((l) => {
    if (busca) {
      const q = busca.toLowerCase()
      if (!l.proj.toLowerCase().includes(q) && !l.ref.toLowerCase().includes(q)) return false
    }
    if (filtroDiretor && l.dir !== filtroDiretor) return false
    if (filtroStatus && l.contratado !== filtroStatus) return false
    return true
  })

  const totalContratadoSim = todasAsLinhas.filter((l) => l.contratado === 'sim').length
  const totalAcompanhamentoSim = todasAsLinhas.filter((l) => l.acompanhamento === 'sim').length
  const totalNaoLocalizado = todasAsLinhas.filter((l) => !l.encontrado).length

  const porDiretor = diretores.map((dir) => {
    const lista = todasAsLinhas.filter((l) => l.dir === dir)
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
          onClick={() => exportarCsv(todasAsLinhas)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ↓ Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border-l-4 border-l-gray-500 border-y border-r border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-gray-900">{todasAsLinhas.length}</p>
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
        <div className="rounded-lg border-l-4 border-l-gray-300 border-y border-r border-gray-200 bg-white p-4">
          <p className="text-3xl font-bold text-gray-400">{totalNaoLocalizado}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500 uppercase">Não localizados no painel</p>
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
              {linhasFiltradas.length} de {todasAsLinhas.length} projetos
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
              <option value="pendente">Pendentes</option>
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

        {totalNaoLocalizado > 0 && (
          <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
            {totalNaoLocalizado} projeto(s) desta lista ainda não foram encontrados no Painel Acústica
            (código não bate com nenhum projeto cadastrado).
          </p>
        )}
      </div>
    </div>
  )
}
