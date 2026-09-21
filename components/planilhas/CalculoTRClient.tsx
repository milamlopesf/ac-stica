'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CalculoTR, MaterialTR } from '@/lib/types/database'
import { TIPOS_AMBIENTE_TR } from '@/lib/utils/tr'
import { NovoCalculoTRModal } from './NovoCalculoTRModal'
import { CalculoTRDetalhe } from './CalculoTRDetalhe'

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function CalculoTRClient({
  calculosIniciais,
  materiais,
}: {
  calculosIniciais: CalculoTR[]
  materiais: MaterialTR[]
}) {
  const supabase = createClient()
  const [calculos, setCalculos] = useState<CalculoTR[]>(calculosIniciais)
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)

  const selecionado = calculos.find((c) => c.id === selecionadoId) ?? null

  function handleCriado(novo: CalculoTR) {
    setCalculos((prev) => [novo, ...prev])
    setModalNovoAberto(false)
    setSelecionadoId(novo.id)
  }

  function handleAtualizado(atualizado: CalculoTR) {
    setCalculos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)))
  }

  async function handleExcluir(id: string) {
    if (!confirm('Apagar este cálculo e todas as superfícies cadastradas nele?')) return
    const { error } = await supabase.from('tr_calculos').delete().eq('id', id)
    if (error) {
      alert(`Erro ao apagar: ${error.message}`)
      return
    }
    setCalculos((prev) => prev.filter((c) => c.id !== id))
    if (selecionadoId === id) setSelecionadoId(null)
  }

  if (selecionado) {
    return (
      <CalculoTRDetalhe
        calculo={selecionado}
        materiais={materiais}
        onVoltar={() => setSelecionadoId(null)}
        onAtualizado={handleAtualizado}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link href="/planilhas" className="text-sm text-blue-600 hover:underline">
            ← Voltar para Planilhas de Cálculo
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Cálculo de TR (Tempo de Reverberação)</h1>
        </div>
        <button
          onClick={() => setModalNovoAberto(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Novo Cálculo
        </button>
      </div>

      {calculos.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Nenhum cálculo salvo ainda. Clique em &quot;+ Novo Cálculo&quot; para começar.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {calculos.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <button onClick={() => setSelecionadoId(c.id)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-gray-900">{c.ambiente}</h3>
                  {c.cliente && <span className="text-sm text-gray-500">· {c.cliente}</span>}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {TIPOS_AMBIENTE_TR[c.tipo_ambiente].label} · {c.volume.toFixed(1)} m³ · atualizado em{' '}
                  {formatarDataHora(c.updated_at)}
                </p>
              </button>
              <button
                onClick={() => handleExcluir(c.id)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Apagar
              </button>
            </div>
          ))}
        </div>
      )}

      {modalNovoAberto && (
        <NovoCalculoTRModal onFechar={() => setModalNovoAberto(false)} onCriado={handleCriado} />
      )}
    </div>
  )
}
