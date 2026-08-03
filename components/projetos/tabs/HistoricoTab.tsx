'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Etapa } from '@/lib/types/database'
import { CORES_ETAPA } from '@/lib/utils/cores'
import { textoSimples } from '@/lib/utils/texto'

type EventoHistorico =
  | { tipo: 'etapa'; data: string; etapaAnterior: Etapa | null; etapaNova: Etapa }
  | { tipo: 'anotacao'; data: string; texto: string }
  | { tipo: 'ata'; data: string; titulo: string }

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function labelEtapa(etapa: Etapa) {
  return CORES_ETAPA[etapa]?.label ?? etapa
}

export function HistoricoTab({ projetoId }: { projetoId: string }) {
  const supabase = createClient()
  const [eventos, setEventos] = useState<EventoHistorico[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      const [{ data: notas }, { data: reunioes }, { data: historico }] = await Promise.all([
        supabase.from('notas').select('*').eq('projeto_id', projetoId),
        supabase.from('reunioes').select('*').eq('projeto_id', projetoId),
        supabase.from('projeto_historico_etapa').select('*').eq('projeto_id', projetoId),
      ])
      if (!ativo) return

      const eventosAnotacoes: EventoHistorico[] = (notas ?? []).map((n) => ({
        tipo: 'anotacao',
        data: n.created_at,
        texto: textoSimples(n.texto),
      }))
      const eventosAtas: EventoHistorico[] = (reunioes ?? []).map((r) => ({
        tipo: 'ata',
        data: r.created_at,
        titulo: r.titulo,
      }))
      const eventosEtapa: EventoHistorico[] = (historico ?? []).map((h) => ({
        tipo: 'etapa',
        data: h.created_at,
        etapaAnterior: h.etapa_anterior,
        etapaNova: h.etapa_nova,
      }))

      const todos = [...eventosAnotacoes, ...eventosAtas, ...eventosEtapa].sort((a, b) =>
        b.data.localeCompare(a.data)
      )

      setEventos(todos)
      setCarregando(false)
    }
    carregar()
    return () => {
      ativo = false
    }
  }, [projetoId, supabase])

  if (carregando) return <p className="text-sm text-gray-500">Carregando...</p>

  if (eventos.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-500">Nenhum evento registrado ainda.</p>
  }

  return (
    <ul className="flex flex-col gap-3">
      {eventos.map((evento, i) => (
        <li key={i} className="flex gap-3 border-b border-gray-100 pb-3 last:border-b-0">
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{
              backgroundColor:
                evento.tipo === 'etapa'
                  ? CORES_ETAPA[evento.etapaNova]?.hex
                  : evento.tipo === 'anotacao'
                    ? '#3b82f6'
                    : '#8b5cf6',
            }}
          />
          <div className="min-w-0 flex-1">
            {evento.tipo === 'etapa' && (
              <p className="text-sm text-gray-800">
                <span className="font-medium">Etapa alterada</span>
                {evento.etapaAnterior ? ` de ${labelEtapa(evento.etapaAnterior)}` : ''} para{' '}
                <span className="font-medium">{labelEtapa(evento.etapaNova)}</span>
              </p>
            )}
            {evento.tipo === 'anotacao' && (
              <p className="line-clamp-2 text-sm text-gray-800">
                <span className="font-medium">Anotação:</span> {evento.texto || '—'}
              </p>
            )}
            {evento.tipo === 'ata' && (
              <p className="text-sm text-gray-800">
                <span className="font-medium">Ata de reunião:</span> {evento.titulo}
              </p>
            )}
            <p className="mt-0.5 text-xs text-gray-400">{formatarDataHora(evento.data)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
