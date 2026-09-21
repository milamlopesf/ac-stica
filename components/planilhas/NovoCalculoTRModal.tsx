'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CalculoTR, TipoAmbienteTR, TipoSomTR } from '@/lib/types/database'
import { TIPOS_AMBIENTE_TR } from '@/lib/utils/tr'

export function NovoCalculoTRModal({
  onFechar,
  onCriado,
}: {
  onFechar: () => void
  onCriado: (calculo: CalculoTR) => void
}) {
  const supabase = createClient()
  const [cliente, setCliente] = useState('')
  const [ambiente, setAmbiente] = useState('')
  const [comprimento, setComprimento] = useState('')
  const [largura, setLargura] = useState('')
  const [altura, setAltura] = useState('')
  const [volumeManual, setVolumeManual] = useState('')
  const [temperatura, setTemperatura] = useState('25')
  const [tipoSom, setTipoSom] = useState<TipoSomTR>('voz')
  const [tipoAmbiente, setTipoAmbiente] = useState<TipoAmbienteTR>('salas_aula')
  const [lotacaoTotal, setLotacaoTotal] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const volumeCalculado = useMemo(() => {
    const c = parseFloat(comprimento)
    const l = parseFloat(largura)
    const a = parseFloat(altura)
    if (c > 0 && l > 0 && a > 0) return c * l * a
    return null
  }, [comprimento, largura, altura])

  const volumeFinal = volumeCalculado ?? parseFloat(volumeManual) ?? null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!ambiente.trim()) {
      setErro('Informe o nome do ambiente.')
      return
    }
    if (!volumeFinal || volumeFinal <= 0) {
      setErro('Informe as dimensões (comprimento, largura, altura) ou o volume do ambiente.')
      return
    }

    setSalvando(true)
    const { data, error } = await supabase
      .from('tr_calculos')
      .insert({
        cliente: cliente.trim() || null,
        ambiente: ambiente.trim(),
        comprimento: comprimento ? parseFloat(comprimento) : null,
        largura: largura ? parseFloat(largura) : null,
        altura: altura ? parseFloat(altura) : null,
        volume: volumeFinal,
        temperatura: parseFloat(temperatura) || 25,
        tipo_som: tipoSom,
        tipo_ambiente: tipoAmbiente,
        lotacao_total: lotacaoTotal ? parseInt(lotacaoTotal, 10) : null,
      })
      .select()
      .single()
    setSalvando(false)

    if (error) {
      setErro(`Erro ao criar cálculo: ${error.message}`)
      return
    }

    onCriado(data as CalculoTR)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Novo Cálculo de TR</h2>

        {erro && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Cliente</label>
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Ambiente</label>
              <input
                required
                value={ambiente}
                onChange={(e) => setAmbiente(e.target.value)}
                placeholder="Ex: Sala de aula 1"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Dimensões (m)</label>
            <div className="mt-1 grid grid-cols-3 gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={comprimento}
                onChange={(e) => setComprimento(e.target.value)}
                placeholder="Comp."
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={largura}
                onChange={(e) => setLargura(e.target.value)}
                placeholder="Larg."
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
                placeholder="Alt."
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {volumeCalculado
                ? `Volume calculado: ${volumeCalculado.toFixed(2)} m³`
                : 'Ou informe o volume diretamente abaixo, se o ambiente não for um paralelepípedo.'}
            </p>
          </div>

          {!volumeCalculado && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Volume (m³)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={volumeManual}
                onChange={(e) => setVolumeManual(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tipo de ambiente</label>
              <select
                value={tipoAmbiente}
                onChange={(e) => setTipoAmbiente(e.target.value as TipoAmbienteTR)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {Object.entries(TIPOS_AMBIENTE_TR).map(([valor, info]) => (
                  <option key={valor} value={valor}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Tipo de som</label>
              <select
                value={tipoSom}
                onChange={(e) => setTipoSom(e.target.value as TipoSomTR)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="voz">Voz</option>
                <option value="musica">Música</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Temperatura (°C)</label>
              <input
                type="number"
                step="0.5"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Lotação total (pessoas)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={lotacaoTotal}
                onChange={(e) => setLotacaoTotal(e.target.value)}
                placeholder="Para ocupação 50%/100%"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
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
              {salvando ? 'Criando...' : 'Criar e continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
