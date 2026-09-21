'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { CalculoTR } from '@/lib/types/database'

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function CalculosTRTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [calculos, setCalculos] = useState<CalculoTR[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    supabase
      .from('tr_calculos')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (ativo) {
          setCalculos((data as CalculoTR[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-4">
      {isEditor && (
        <Link
          href={`/planilhas/calculo-tr?novo=1&projeto=${projetoId}`}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          + Novo cálculo de TR
        </Link>
      )}

      {calculos.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nenhum cálculo de TR vinculado a este projeto.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {calculos.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <Link href={`/planilhas/calculo-tr?calculo=${c.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-blue-700 hover:underline">{c.ambiente}</p>
                <p className="text-xs text-gray-500">
                  {c.volume.toFixed(1)} m³ · atualizado em {formatarDataHora(c.updated_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
