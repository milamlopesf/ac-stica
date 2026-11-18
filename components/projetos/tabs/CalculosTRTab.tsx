'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Anexo, CalculoTR } from '@/lib/types/database'
import { formatarTamanho } from '@/lib/utils/storage'

const BUCKET_ANEXOS = 'anexos-projetos'
const PREFIXO_VISTORIA = 'Vistoria_Acustica_'

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function CalculosTRTab({ projetoId, isEditor }: { projetoId: string; isEditor: boolean }) {
  const supabase = createClient()
  const [calculos, setCalculos] = useState<CalculoTR[]>([])
  const [vistorias, setVistorias] = useState<Anexo[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    Promise.all([
      supabase.from('tr_calculos').select('*').eq('projeto_id', projetoId).order('updated_at', { ascending: false }),
      supabase
        .from('anexos')
        .select('*')
        .eq('projeto_id', projetoId)
        .ilike('nome_arquivo', `${PREFIXO_VISTORIA}%`)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: dadosCalculos }, { data: dadosVistorias }]) => {
      if (ativo) {
        setCalculos((dadosCalculos as CalculoTR[]) ?? [])
        setVistorias((dadosVistorias as Anexo[]) ?? [])
        setCarregando(false)
      }
    })
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  async function baixarVistoria(anexo: Anexo) {
    const { data, error } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrl(anexo.caminho_storage, 60, { download: anexo.nome_arquivo })
    if (error || !data) {
      alert(`Erro ao gerar link de download: ${error?.message ?? ''}`)
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Cálculo de TR</h4>
          {isEditor && (
            <Link
              href={`/planilhas/calculo-tr?novo=1&projeto=${projetoId}`}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              + Novo cálculo de TR
            </Link>
          )}
        </div>

        {calculos.length === 0 ? (
          <p className="py-2 text-sm text-gray-500">Nenhum cálculo de TR vinculado a este projeto.</p>
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

      <div className="flex flex-col gap-4 border-t border-gray-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Vistoria Acústica (WhatsApp)</h4>
          {isEditor && (
            <Link
              href={`/planilhas/vistoria-whatsapp`}
              className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              + Nova vistoria
            </Link>
          )}
        </div>

        {vistorias.length === 0 ? (
          <p className="py-2 text-sm text-gray-500">Nenhuma planilha de vistoria gerada para este projeto.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100">
            {vistorias.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                <button
                  onClick={() => baixarVistoria(v)}
                  className="min-w-0 flex-1 text-left text-sm font-medium text-blue-700 hover:underline"
                  title={v.nome_arquivo}
                >
                  <p className="truncate">{v.nome_arquivo}</p>
                  <p className="text-xs font-normal text-gray-500">
                    {formatarTamanho(v.tamanho_bytes)} · {formatarDataHora(v.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
