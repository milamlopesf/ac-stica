'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Projeto, Etapa, StatusProjeto } from '@/lib/types/database'
import { ETAPAS, STATUS_PROJETO, PROJETISTAS_ACUSTICOS, DIRETORES } from '@/lib/utils/cores'
import { ETAPAS_COM_CHECKLIST_PADRAO, CHECKLIST_PADRAO } from '@/lib/utils/checklistPadrao'

export function ProjetoFormModal({
  projeto,
  gerentesExistentes = [],
  onFechar,
  onSalvo,
}: {
  projeto?: Projeto
  gerentesExistentes?: string[]
  onFechar: () => void
  onSalvo: (projeto: Projeto) => void
}) {
  const supabase = createClient()
  const [nome, setNome] = useState(projeto?.nome ?? '')
  const [etapa, setEtapa] = useState<Etapa>(projeto?.etapa ?? 'DNN')
  const [status, setStatus] = useState<StatusProjeto>(projeto?.status ?? 'A Fazer')
  const [entrega, setEntrega] = useState(projeto?.entrega ?? '')
  const [diretor, setDiretor] = useState(projeto?.diretor ?? '')
  const [gerente, setGerente] = useState(projeto?.gerente ?? '')
  const [projetista, setProjetista] = useState(projeto?.projetista ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    const payload = {
      nome,
      etapa,
      status,
      entrega: entrega || null,
      diretor: diretor || null,
      gerente: gerente || null,
      projetista: projetista || null,
    }

    const query = projeto
      ? supabase.from('projetos').update(payload).eq('id', projeto.id).select().single()
      : supabase.from('projetos').insert(payload).select().single()

    const { data, error } = await query

    if (error) {
      setSalvando(false)
      setErro(error.message)
      return
    }

    const novoProjeto = data as Projeto

    if (!projeto && ETAPAS_COM_CHECKLIST_PADRAO.includes(novoProjeto.etapa)) {
      const { error: erroChecklist } = await supabase.from('atividades').insert(
        CHECKLIST_PADRAO.map((texto) => ({ projeto_id: novoProjeto.id, texto }))
      )
      if (erroChecklist) {
        setSalvando(false)
        setErro(
          `Projeto criado, mas houve um erro ao gerar o checklist padrão: ${erroChecklist.message}`
        )
        return
      }
    }

    setSalvando(false)
    onSalvo(novoProjeto)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {projeto ? 'Editar Projeto' : 'Novo Projeto'}
        </h2>

        {erro && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Nome</label>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Etapa</label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value as Etapa)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {ETAPAS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusProjeto)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {STATUS_PROJETO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Data de entrega</label>
            <input
              type="date"
              value={entrega ?? ''}
              onChange={(e) => setEntrega(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Diretor</label>
              <select
                value={diretor ?? ''}
                onChange={(e) => setDiretor(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="">Selecione...</option>
                {DIRETORES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Gerente</label>
              <input
                value={gerente ?? ''}
                onChange={(e) => setGerente(e.target.value)}
                list="gerentes-existentes"
                placeholder="Digite ou escolha"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <datalist id="gerentes-existentes">
                {gerentesExistentes.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Projetista acústico</label>
            <select
              value={projetista ?? ''}
              onChange={(e) => setProjetista(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="">Selecione...</option>
              {PROJETISTAS_ACUSTICOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onFechar}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
