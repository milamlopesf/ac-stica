'use client'

import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import type { CalculoTR, MaterialTR, SuperficieTR, TipoAmbienteTR, TipoSomTR, CenarioTR } from '@/lib/types/database'
import {
  BANDAS_FREQUENCIA,
  LABEL_CENARIO,
  PERCENTUAIS_OCUPACAO,
  TIPOS_AMBIENTE_TR,
  calcularAbsorcaoBandas,
  calcularEyringPorBanda,
  calcularFaixaTolerancia,
  calcularFrequenciaSchroeder,
  calcularMFP,
  calcularSabinePorBanda,
  calcularTRAlvo1kHz,
  calcularTempoMedioReflexoes,
  calcularVelocidadeSom,
  lotacaoParaOcupacao,
  type SuperficieCalculo,
} from '@/lib/utils/tr'

function fmt(v: number | null | undefined, casas = 2) {
  return v === null || v === undefined || Number.isNaN(v) ? '—' : v.toFixed(casas)
}

export function CalculoTRDetalhe({
  calculo,
  materiais,
  onVoltar,
  onAtualizado,
}: {
  calculo: CalculoTR
  materiais: MaterialTR[]
  onVoltar: () => void
  onAtualizado: (c: CalculoTR) => void
}) {
  const supabase = createClient()
  const [superficies, setSuperficies] = useState<SuperficieTR[]>([])
  const [carregando, setCarregando] = useState(true)
  const [ocupacao, setOcupacao] = useState<(typeof PERCENTUAIS_OCUPACAO)[number]>(100)
  const [metodoGrafico, setMetodoGrafico] = useState<'sabine' | 'eyring'>('eyring')
  const [editandoDados, setEditandoDados] = useState(false)

  useEffect(() => {
    let ativo = true
    supabase
      .from('tr_calculo_superficies')
      .select('*')
      .eq('calculo_id', calculo.id)
      .order('ordem', { ascending: true })
      .then(({ data }) => {
        if (ativo) {
          setSuperficies((data as SuperficieTR[]) ?? [])
          setCarregando(false)
        }
      })
    return () => {
      ativo = false
    }
  }, [calculo.id, supabase])

  const materiaisPorId = useMemo(() => new Map(materiais.map((m) => [m.id, m])), [materiais])
  const materiaisPublico = useMemo(() => materiais.filter((m) => m.unidade === 'sabins_por_pessoa'), [materiais])

  async function adicionarSuperficie(cenario: CenarioTR, materialId: string, area: number, descricao: string) {
    const ordem = superficies.filter((s) => s.cenario === cenario).length
    const { data, error } = await supabase
      .from('tr_calculo_superficies')
      .insert({ calculo_id: calculo.id, cenario, material_id: materialId, area, descricao: descricao || null, ordem })
      .select()
      .single()
    if (error) {
      alert(`Erro ao adicionar superfície: ${error.message}`)
      return
    }
    setSuperficies((prev) => [...prev, data as SuperficieTR])
  }

  async function removerSuperficie(id: string) {
    const anterior = superficies
    setSuperficies((prev) => prev.filter((s) => s.id !== id))
    const { error } = await supabase.from('tr_calculo_superficies').delete().eq('id', id)
    if (error) {
      alert(`Erro ao remover: ${error.message}`)
      setSuperficies(anterior)
    }
  }

  async function salvarDados(dados: Partial<Omit<CalculoTR, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('tr_calculos')
      .update({ ...dados, updated_at: new Date().toISOString() })
      .eq('id', calculo.id)
      .select()
      .single()
    if (error) {
      alert(`Erro ao salvar: ${error.message}`)
      return
    }
    onAtualizado(data as CalculoTR)
    setEditandoDados(false)
  }

  const superficiesPorCenario = (cenario: CenarioTR): SuperficieCalculo[] =>
    superficies
      .filter((s) => s.cenario === cenario)
      .map((s) => ({ material: materiaisPorId.get(s.material_id)!, area: s.area }))
      .filter((s) => s.material)

  const resultado = useMemo(() => {
    const velocidadeSom = calcularVelocidadeSom(calculo.temperatura)
    const trAlvo1kHz = calcularTRAlvo1kHz(calculo.tipo_ambiente, calculo.volume, calculo.tr_alvo_1khz_personalizado)
    const faixa = calcularFaixaTolerancia(calculo.tipo_som, trAlvo1kHz)

    const materialPublico = calculo.material_publico_id ? materiaisPorId.get(calculo.material_publico_id) : undefined
    const pessoas = lotacaoParaOcupacao(calculo.lotacao_total, ocupacao)

    const absAtual = calcularAbsorcaoBandas(superficiesPorCenario('atual'), null)
    const absProposta = calcularAbsorcaoBandas(
      superficiesPorCenario('proposta'),
      materialPublico ? { material: materialPublico, pessoas } : null
    )

    const sabineAtual = calcularSabinePorBanda(calculo.volume, absAtual.absorcaoPorBanda)
    const eyringAtual = calcularEyringPorBanda(calculo.volume, absAtual.areaSuperficieTotal, absAtual.absorcaoPorBanda, velocidadeSom)
    const sabineProposta = calcularSabinePorBanda(calculo.volume, absProposta.absorcaoPorBanda)
    const eyringProposta = calcularEyringPorBanda(
      calculo.volume,
      absProposta.areaSuperficieTotal,
      absProposta.absorcaoPorBanda,
      velocidadeSom
    )

    const mfpAtual = calcularMFP(calculo.volume, absAtual.areaSuperficieTotal)
    const mfpProposta = calcularMFP(calculo.volume, absProposta.areaSuperficieTotal)
    const t1kHzProposta = eyringProposta[3] ?? sabineProposta[3]
    const schroeder = t1kHzProposta ? calcularFrequenciaSchroeder(t1kHzProposta, calculo.volume) : null

    return {
      velocidadeSom,
      trAlvo1kHz,
      faixa,
      absAtual,
      absProposta,
      sabineAtual,
      eyringAtual,
      sabineProposta,
      eyringProposta,
      mfpAtual,
      mfpProposta,
      tReflexoesProposta: calcularTempoMedioReflexoes(mfpProposta, velocidadeSom),
      schroeder,
      pessoas,
    }
  }, [calculo, superficies, ocupacao, materiaisPorId])

  const dadosGrafico = BANDAS_FREQUENCIA.map((freq, i) => ({
    frequencia: `${freq}`,
    atual: (metodoGrafico === 'eyring' ? resultado.eyringAtual : resultado.sabineAtual)[i],
    proposta: (metodoGrafico === 'eyring' ? resultado.eyringProposta : resultado.sabineProposta)[i],
    max: resultado.faixa.max[i],
    min: resultado.faixa.min[i],
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button onClick={onVoltar} className="text-sm text-blue-600 hover:underline">
            ← Voltar para a lista
          </button>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{calculo.ambiente}</h1>
          {calculo.cliente && <p className="text-sm text-gray-500">Cliente: {calculo.cliente}</p>}
        </div>
        <button
          onClick={() => setEditandoDados((v) => !v)}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {editandoDados ? 'Fechar edição' : 'Editar dados do ambiente'}
        </button>
      </div>

      {editandoDados && (
        <DadosAmbienteForm calculo={calculo} materiaisPublico={materiaisPublico} onSalvar={salvarDados} />
      )}

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-3 lg:grid-cols-6">
        <Info label="Volume" valor={`${calculo.volume.toFixed(1)} m³`} />
        <Info label="Tipo de ambiente" valor={TIPOS_AMBIENTE_TR[calculo.tipo_ambiente].label} />
        <Info label="Tipo de som" valor={calculo.tipo_som === 'voz' ? 'Voz' : 'Música'} />
        <Info label="TR alvo (1kHz)" valor={`${fmt(resultado.trAlvo1kHz)} s`} />
        <Info label="Velocidade do som" valor={`${fmt(resultado.velocidadeSom, 1)} m/s`} />
        <Info label="Lotação total" valor={calculo.lotacao_total ? `${calculo.lotacao_total} pessoas` : '—'} />
      </div>

      {carregando ? (
        <p className="text-sm text-gray-500">Carregando superfícies...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CenarioSuperficies
            cenario="atual"
            materiais={materiais}
            superficies={superficies.filter((s) => s.cenario === 'atual')}
            onAdicionar={(materialId, area, descricao) => adicionarSuperficie('atual', materialId, area, descricao)}
            onRemover={removerSuperficie}
          />
          <CenarioSuperficies
            cenario="proposta"
            materiais={materiais}
            superficies={superficies.filter((s) => s.cenario === 'proposta')}
            onAdicionar={(materialId, area, descricao) => adicionarSuperficie('proposta', materialId, area, descricao)}
            onRemover={removerSuperficie}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">Ocupação (proposta):</span>
            {PERCENTUAIS_OCUPACAO.map((p) => (
              <button
                key={p}
                onClick={() => setOcupacao(p)}
                className={`rounded-md px-2.5 py-1 font-medium ${
                  ocupacao === p ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">Método no gráfico:</span>
            {(['eyring', 'sabine'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetodoGrafico(m)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize ${
                  metodoGrafico === m ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80 rounded-lg border border-gray-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dadosGrafico}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="frequencia" label={{ value: 'Frequência (Hz)', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'T60 (s)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(v) => `${Number(v).toFixed(2)} s`} />
            <Legend />
            <Line type="monotone" dataKey="min" name="Mín. tolerância" stroke="#f87171" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="max" name="Máx. tolerância" stroke="#f87171" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey="atual" name="Situação atual" stroke="#9ca3af" strokeWidth={2} />
            <Line type="monotone" dataKey="proposta" name="Projeto proposto" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">T60 (s)</th>
              {BANDAS_FREQUENCIA.map((f) => (
                <th key={f} className="px-3 py-2 text-right">
                  {f} Hz
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <LinhaResultado label="Atual · Sabine" valores={resultado.sabineAtual} />
            <LinhaResultado label="Atual · Eyring" valores={resultado.eyringAtual} />
            <LinhaResultado label={`Proposta (${ocupacao}%) · Sabine`} valores={resultado.sabineProposta} />
            <LinhaResultado label={`Proposta (${ocupacao}%) · Eyring`} valores={resultado.eyringProposta} />
            <LinhaResultado label="Máx. tolerância" valores={resultado.faixa.max} destaque />
            <LinhaResultado label="Mín. tolerância" valores={resultado.faixa.min} destaque />
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-4">
        <Info label="Área de superfície (atual)" valor={`${fmt(resultado.absAtual.areaSuperficieTotal, 1)} m²`} />
        <Info label="Área de superfície (proposta)" valor={`${fmt(resultado.absProposta.areaSuperficieTotal, 1)} m²`} />
        <Info label="MFP (proposta)" valor={`${fmt(resultado.mfpProposta, 2)} m`} />
        <Info label="Freq. de Schroeder" valor={`${fmt(resultado.schroeder, 0)} Hz`} />
      </div>
    </div>
  )
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{valor}</p>
    </div>
  )
}

function LinhaResultado({ label, valores, destaque }: { label: string; valores: (number | null)[]; destaque?: boolean }) {
  return (
    <tr className={destaque ? 'bg-gray-50 text-gray-500' : ''}>
      <td className="px-3 py-2 font-medium text-gray-700">{label}</td>
      {valores.map((v, i) => (
        <td key={i} className="px-3 py-2 text-right tabular-nums">
          {fmt(v)}
        </td>
      ))}
    </tr>
  )
}

function DadosAmbienteForm({
  calculo,
  materiaisPublico,
  onSalvar,
}: {
  calculo: CalculoTR
  materiaisPublico: MaterialTR[]
  onSalvar: (dados: Partial<Omit<CalculoTR, 'id' | 'created_at' | 'updated_at'>>) => void
}) {
  const [cliente, setCliente] = useState(calculo.cliente ?? '')
  const [ambiente, setAmbiente] = useState(calculo.ambiente)
  const [volume, setVolume] = useState(String(calculo.volume))
  const [temperatura, setTemperatura] = useState(String(calculo.temperatura))
  const [tipoSom, setTipoSom] = useState<TipoSomTR>(calculo.tipo_som)
  const [tipoAmbiente, setTipoAmbiente] = useState<TipoAmbienteTR>(calculo.tipo_ambiente)
  const [trPersonalizado, setTrPersonalizado] = useState(
    calculo.tr_alvo_1khz_personalizado ? String(calculo.tr_alvo_1khz_personalizado) : ''
  )
  const [lotacaoTotal, setLotacaoTotal] = useState(calculo.lotacao_total ? String(calculo.lotacao_total) : '')
  const [materialPublicoId, setMaterialPublicoId] = useState(calculo.material_publico_id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSalvar({
      cliente: cliente.trim() || null,
      ambiente: ambiente.trim(),
      volume: parseFloat(volume) || calculo.volume,
      temperatura: parseFloat(temperatura) || 25,
      tipo_som: tipoSom,
      tipo_ambiente: tipoAmbiente,
      tr_alvo_1khz_personalizado: trPersonalizado ? parseFloat(trPersonalizado) : null,
      lotacao_total: lotacaoTotal ? parseInt(lotacaoTotal, 10) : null,
      material_publico_id: materialPublicoId || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
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
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Volume (m³)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
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
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Lotação total</label>
          <input
            type="number"
            min="0"
            step="1"
            value={lotacaoTotal}
            onChange={(e) => setLotacaoTotal(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
        {tipoAmbiente === 'personalizado' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">TR alvo a 1kHz (s)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={trPersonalizado}
              onChange={(e) => setTrPersonalizado(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Absorção por pessoa (público)</label>
          <select
            value={materialPublicoId}
            onChange={(e) => setMaterialPublicoId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">Nenhuma (ignorar ocupação)</option>
            {materiaisPublico.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Salvar dados
        </button>
      </div>
    </form>
  )
}

function CenarioSuperficies({
  cenario,
  materiais,
  superficies,
  onAdicionar,
  onRemover,
}: {
  cenario: CenarioTR
  materiais: MaterialTR[]
  superficies: SuperficieTR[]
  onAdicionar: (materialId: string, area: number, descricao: string) => void
  onRemover: (id: string) => void
}) {
  const materiaisPorId = useMemo(() => new Map(materiais.map((m) => [m.id, m])), [materiais])
  const [filtro, setFiltro] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [area, setArea] = useState('')
  const [descricao, setDescricao] = useState('')

  const materiaisFiltrados = useMemo(() => {
    const materiaisArea = materiais.filter((m) => m.unidade === 'coef_area')
    if (!filtro.trim()) return materiaisArea.slice(0, 200)
    const termo = filtro.toLowerCase()
    return materiaisArea.filter((m) => m.nome.toLowerCase().includes(termo) || m.categoria.toLowerCase().includes(termo))
  }, [materiais, filtro])

  function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    const areaNum = parseFloat(area)
    if (!materialId || !(areaNum > 0)) return
    onAdicionar(materialId, areaNum, descricao)
    setArea('')
    setDescricao('')
  }

  const areaTotal = superficies.reduce((soma, s) => soma + s.area, 0)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="font-semibold text-gray-900">{LABEL_CENARIO[cenario]}</h3>

      {superficies.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma superfície cadastrada.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-gray-100">
          {superficies.map((s) => {
            const material = materiaisPorId.get(s.material_id)
            return (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">{material?.nome ?? 'Material removido'}</p>
                  <p className="text-xs text-gray-500">
                    {s.area.toFixed(1)} m²{s.descricao ? ` · ${s.descricao}` : ''}
                  </p>
                </div>
                <button onClick={() => onRemover(s.id)} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                  Remover
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-gray-500">Área total: {areaTotal.toFixed(1)} m²</p>

      <form onSubmit={handleAdicionar} className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar material..."
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        />
        <select
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">Selecione o material...</option>
          {materiaisFiltrados.map((m) => (
            <option key={m.id} value={m.id}>
              {m.categoria} — {m.nome}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Área (m²)"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          + Adicionar superfície
        </button>
      </form>
    </div>
  )
}
