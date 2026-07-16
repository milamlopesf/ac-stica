'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export interface DonutDatum {
  nome: string
  valor: number
  cor: string
}

export function DonutChart({ titulo, dados }: { titulo: string; dados: DonutDatum[] }) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0)

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">{titulo}</h3>

      <div className="relative mx-auto h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="nome"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={dados.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="none"
              isAnimationActive={false}
            >
              {dados.map((d) => (
                <Cell key={d.nome} fill={d.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor, nome) => [`${valor} projeto(s)`, nome]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-gray-900">{total}</span>
          <span className="text-xs text-gray-500">projetos</span>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {dados.map((d) => (
          <li key={d.nome} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} />
              <span className="truncate text-gray-700">{d.nome}</span>
            </span>
            <span className="shrink-0 font-medium text-gray-500">{d.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
