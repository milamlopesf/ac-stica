'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import clsx from 'clsx'
import type { Atividade, Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS_ATIVIDADE } from '@/lib/utils/cores'
import { Badge } from '@/components/ui/Badge'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CalendarioClient({
  projetos,
  atividades,
}: {
  projetos: Projeto[]
  atividades: Atividade[]
}) {
  const [mesAtual, setMesAtual] = useState(() => new Date())
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null)

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 })
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 })
    return eachDayOfInterval({ start: inicio, end: fim })
  }, [mesAtual])

  function projetosNoDia(dia: Date) {
    return projetos.filter((p) => p.entrega && isSameDay(new Date(`${p.entrega}T00:00:00`), dia))
  }

  function atividadesNoDia(dia: Date) {
    return atividades.filter(
      (a) => a.data_vencimento && isSameDay(new Date(`${a.data_vencimento}T00:00:00`), dia)
    )
  }

  const projetosDoDiaSelecionado = diaSelecionado ? projetosNoDia(diaSelecionado) : []
  const atividadesDoDiaSelecionado = diaSelecionado ? atividadesNoDia(diaSelecionado) : []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Calendário</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMesAtual((m) => subMonths(m, 1))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="w-40 text-center text-sm font-medium capitalize text-gray-800">
            {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            onClick={() => setMesAtual((m) => addMonths(m, 1))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Próximo →
          </button>
          <button
            onClick={() => setMesAtual(new Date())}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="border-b border-gray-200 bg-gray-50 py-2 text-center text-xs font-medium text-gray-500"
          >
            {d}
          </div>
        ))}

        {dias.map((dia) => {
          const noMes = isSameMonth(dia, mesAtual)
          const entregas = projetosNoDia(dia)
          const vencimentos = atividadesNoDia(dia)
          const hoje = isSameDay(dia, new Date())
          const totalItens = entregas.length + vencimentos.length

          return (
            <button
              key={dia.toISOString()}
              onClick={() => setDiaSelecionado(dia)}
              className={clsx(
                'flex min-h-24 flex-col gap-1 border-b border-r border-gray-100 p-1.5 text-left align-top last:border-r-0',
                !noMes && 'bg-gray-50/60',
                totalItens > 0 && 'hover:bg-blue-50'
              )}
            >
              <span
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  hoje ? 'bg-blue-600 font-semibold text-white' : noMes ? 'text-gray-700' : 'text-gray-300'
                )}
              >
                {format(dia, 'd')}
              </span>

              <div className="flex flex-col gap-0.5">
                {entregas.slice(0, 2).map((p) => (
                  <span
                    key={p.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${CORES_ETAPA[p.etapa].hex}22`, color: CORES_ETAPA[p.etapa].hex }}
                    title={`Entrega: ${p.nome}`}
                  >
                    📦 {p.nome}
                  </span>
                ))}
                {vencimentos.slice(0, 2).map((a) => (
                  <span
                    key={a.id}
                    className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${CORES_STATUS_ATIVIDADE[a.status].hex}22`,
                      color: CORES_STATUS_ATIVIDADE[a.status].hex,
                    }}
                    title={`Vencimento: ${a.texto}`}
                  >
                    ✓ {a.texto}
                  </span>
                ))}
                {totalItens > 4 && (
                  <span className="text-[10px] text-gray-400">+{totalItens - 4} mais</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {diaSelecionado && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold capitalize text-gray-900">
                {format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })}
              </h2>
              <button
                onClick={() => setDiaSelecionado(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {projetosDoDiaSelecionado.length === 0 && atividadesDoDiaSelecionado.length === 0 ? (
              <p className="text-sm text-gray-500">Nada agendado para este dia.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {projetosDoDiaSelecionado.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
                      Entregas de projeto
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {projetosDoDiaSelecionado.map((p) => (
                        <li key={p.id} className="flex items-center gap-2 text-sm">
                          <Badge label={CORES_ETAPA[p.etapa].label} className={CORES_ETAPA[p.etapa].badge} />
                          {p.nome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {atividadesDoDiaSelecionado.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">
                      Vencimento de atividades
                    </h3>
                    <ul className="flex flex-col gap-2">
                      {atividadesDoDiaSelecionado.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm">
                          <Badge
                            label={CORES_STATUS_ATIVIDADE[a.status].label}
                            className={CORES_STATUS_ATIVIDADE[a.status].badge}
                          />
                          {a.texto}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
