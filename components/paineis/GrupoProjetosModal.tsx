'use client'

import Link from 'next/link'
import type { Projeto } from '@/lib/types/database'
import { CORES_ETAPA, CORES_STATUS } from '@/lib/utils/cores'

export function GrupoProjetosModal({
  titulo,
  projetos,
  onFechar,
}: {
  titulo: string
  projetos: Projeto[]
  onFechar: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onFechar}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800" title={titulo}>
              {titulo}
            </p>
            <p className="text-xs text-gray-500">{projetos.length} projeto(s)</p>
          </div>
          <button
            onClick={onFechar}
            className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {projetos.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Nenhum projeto neste grupo.</p>
        ) : (
          <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {projetos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/projetos?projeto=${p.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-gray-800" title={p.nome}>
                    {p.nome}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      style={{ borderColor: CORES_ETAPA[p.etapa].hex, color: CORES_ETAPA[p.etapa].hex }}
                    >
                      {CORES_ETAPA[p.etapa].label}
                    </span>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                      style={{ borderColor: CORES_STATUS[p.status].hex, color: CORES_STATUS[p.status].hex }}
                    >
                      {CORES_STATUS[p.status].label}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
