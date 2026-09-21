import type { CenarioTR, MaterialTR, TipoAmbienteTR, TipoSomTR } from '@/lib/types/database'

/** As 6 bandas de oitava usadas em toda a calculadora, na ordem fixa do banco. */
export const BANDAS_FREQUENCIA = [125, 250, 500, 1000, 2000, 4000] as const
export type BandaFrequencia = (typeof BANDAS_FREQUENCIA)[number]

export const CAMPOS_COEFICIENTE = [
  'coef_125',
  'coef_250',
  'coef_500',
  'coef_1000',
  'coef_2000',
  'coef_4000',
] as const satisfies readonly (keyof MaterialTR)[]

export function coeficientesMaterial(material: MaterialTR): number[] {
  return CAMPOS_COEFICIENTE.map((campo) => material[campo])
}

/**
 * Curva-alvo de TR a 1kHz por tipo de ambiente: regressão linear (m*volume+n)
 * contra o volume do ambiente, reconstruída a partir da planilha original
 * (aba T60, tabela BC14:BH23) — aproxima o nomograma de Everest & Pohlmann.
 * "Restaurantes" usa fórmula própria (volume/20); "personalizado" usa o
 * valor informado manualmente em vez de regressão.
 */
export const TIPOS_AMBIENTE_TR: Record<
  TipoAmbienteTR,
  { label: string; tipoFonte: TipoSomTR | 'voz/musica'; regressao: { m: number; n: number } | null }
> = {
  estudio_radio_voz: {
    label: 'Estúdios de rádio e de voz',
    tipoFonte: 'voz',
    regressao: { m: 3.212851406e-5, n: 0.4742971888 },
  },
  anfiteatro_voz: {
    label: 'Anfiteatro para voz',
    tipoFonte: 'voz',
    regressao: { m: 3.00120048e-5, n: 0.7199879952 },
  },
  teatros: {
    label: 'Teatros',
    tipoFonte: 'voz',
    regressao: { m: 2.822580645e-5, n: 0.9717741935 },
  },
  igrejas_fala: {
    label: 'Igrejas (fala)',
    tipoFonte: 'voz',
    regressao: { m: 5.008012821e-5, n: 1.149919872 },
  },
  igrejas_musica: {
    label: 'Igrejas (música)',
    tipoFonte: 'musica',
    regressao: { m: 5.402160864e-5, n: 1.445978391 },
  },
  salas_concerto_classico: {
    label: 'Salas de concerto clássico',
    tipoFonte: 'musica',
    regressao: { m: 3.629032258e-5, n: 1.363709677 },
  },
  salas_concerto_romantico: {
    label: 'Salas de concerto romântico',
    tipoFonte: 'musica',
    regressao: { m: 5.008012821e-5, n: 1.649919872 },
  },
  salas_aula: {
    label: 'Salas de aula',
    tipoFonte: 'voz',
    regressao: { m: 0.0003533568905, n: 0.5 },
  },
  restaurantes: {
    label: 'Restaurantes',
    tipoFonte: 'voz',
    regressao: null,
  },
  home_theater_cinema: {
    label: 'Home theater / cinema',
    tipoFonte: 'voz/musica',
    regressao: { m: 6.653832164e-5, n: 0.3434424266 },
  },
  personalizado: {
    label: 'Personalizado (informar TR alvo a 1kHz)',
    tipoFonte: 'voz/musica',
    regressao: null,
  },
}

/**
 * TR alvo a 1kHz para o tipo de ambiente selecionado. "Restaurantes" usa a
 * fórmula própria da planilha (volume/20); "personalizado" usa o valor
 * informado pelo usuário.
 */
export function calcularTRAlvo1kHz(
  tipoAmbiente: TipoAmbienteTR,
  volume: number,
  trPersonalizado: number | null
): number {
  if (tipoAmbiente === 'personalizado') return trPersonalizado ?? 0
  if (tipoAmbiente === 'restaurantes') return volume / 20
  const regressao = TIPOS_AMBIENTE_TR[tipoAmbiente].regressao
  if (!regressao) return trPersonalizado ?? 0
  return regressao.m * volume + regressao.n
}

/**
 * Fatores multiplicativos das faixas de tolerância Everest & Pohlmann por
 * banda, aplicados sobre o TR alvo a 1kHz. Reconstruído da planilha original
 * (aba T60, tabela AZ45:BF50).
 */
const FATOR_MAX_VOZ = [1.2, 1.2, 1.2, 1.2, 1.2, 1.2]
const FATOR_MIN_VOZ = [0.6, 0.8, 0.8, 0.8, 0.8, 0.7]
const FATOR_MAX_MUSICA = [1.4, 1.2, 1.2, 1.2, 1.2, 1.2]
const FATOR_MIN_MUSICA = [1.0, 0.8, 0.8, 0.8, 0.8, 0.7]

export function calcularFaixaTolerancia(tipoSom: TipoSomTR, trAlvo1kHz: number) {
  const fatorMax = tipoSom === 'voz' ? FATOR_MAX_VOZ : FATOR_MAX_MUSICA
  const fatorMin = tipoSom === 'voz' ? FATOR_MIN_VOZ : FATOR_MIN_MUSICA
  return {
    max: fatorMax.map((f) => f * trAlvo1kHz),
    min: fatorMin.map((f) => f * trAlvo1kHz),
  }
}

/** Velocidade do som no ar (m/s) em função da temperatura (°C). */
export function calcularVelocidadeSom(temperaturaC: number): number {
  return 331 + 0.6 * temperaturaC
}

/** Livre percurso médio (m): 4*Volume / Área total de superfície. */
export function calcularMFP(volume: number, areaSuperficieTotal: number): number | null {
  if (areaSuperficieTotal <= 0) return null
  return (4 * volume) / areaSuperficieTotal
}

/** Tempo médio entre reflexões (ms). */
export function calcularTempoMedioReflexoes(mfp: number | null, velocidadeSom: number): number | null {
  if (mfp === null || velocidadeSom <= 0) return null
  return (mfp / velocidadeSom) * 1000
}

/** Frequência de Schroeder (Hz) a partir do TR a 1kHz e do volume. */
export function calcularFrequenciaSchroeder(tr1kHz: number, volume: number): number | null {
  if (volume <= 0 || tr1kHz <= 0) return null
  return 2000 * Math.sqrt(tr1kHz / volume)
}

export type SuperficieCalculo = {
  material: MaterialTR
  area: number
}

export type AbsorcaoBandas = {
  /** Área total de superfície (m²) somada — usada como S no cálculo de Eyring. */
  areaSuperficieTotal: number
  /** Absorção total (sabins) por banda: Σ área × coeficiente. */
  absorcaoPorBanda: number[]
}

/**
 * Soma a absorção (sabins) por banda de um cenário: materiais aplicados por
 * área + (opcionalmente) o público, aplicado por lotação (pessoas), não por
 * área — a absorção por pessoa já é um valor absoluto em sabins, então não
 * entra na área total de superfície (S), só no numerador de absorção.
 */
export function calcularAbsorcaoBandas(
  superficies: SuperficieCalculo[],
  publico?: { material: MaterialTR; pessoas: number } | null
): AbsorcaoBandas {
  const absorcaoPorBanda = BANDAS_FREQUENCIA.map(() => 0)
  let areaSuperficieTotal = 0

  for (const { material, area } of superficies) {
    if (area <= 0) continue
    areaSuperficieTotal += area
    const coefs = coeficientesMaterial(material)
    coefs.forEach((c, i) => {
      absorcaoPorBanda[i] += area * c
    })
  }

  if (publico && publico.pessoas > 0) {
    const coefs = coeficientesMaterial(publico.material)
    coefs.forEach((c, i) => {
      absorcaoPorBanda[i] += publico.pessoas * c
    })
  }

  return { areaSuperficieTotal, absorcaoPorBanda }
}

/** T60 pelo método de Sabine (s), por banda: 0.161*V / A. */
export function calcularSabinePorBanda(volume: number, absorcaoPorBanda: number[]): (number | null)[] {
  return absorcaoPorBanda.map((a) => (a > 0 ? (0.161 * volume) / a : null))
}

/**
 * T60 pelo método de Eyring (s), por banda: 55.3*V / (c*(-S*ln(1-ᾱ))).
 * Retorna null quando ᾱ >= 1 (absorção maior que a área — fisicamente
 * inválido) ou quando não há superfície cadastrada.
 */
export function calcularEyringPorBanda(
  volume: number,
  areaSuperficieTotal: number,
  absorcaoPorBanda: number[],
  velocidadeSom: number
): (number | null)[] {
  if (areaSuperficieTotal <= 0) return absorcaoPorBanda.map(() => null)
  return absorcaoPorBanda.map((a) => {
    const alphaMedio = a / areaSuperficieTotal
    if (alphaMedio <= 0 || alphaMedio >= 1) return null
    return (55.3 * volume) / (velocidadeSom * (-areaSuperficieTotal * Math.log(1 - alphaMedio)))
  })
}

/** Lotação efetiva (nº de pessoas) para um percentual de ocupação. */
export function lotacaoParaOcupacao(lotacaoTotal: number | null, percentualOcupacao: number): number {
  if (!lotacaoTotal) return 0
  return Math.round(lotacaoTotal * (percentualOcupacao / 100))
}

export const PERCENTUAIS_OCUPACAO = [0, 50, 100] as const

export const LABEL_CENARIO: Record<CenarioTR, string> = {
  atual: 'Situação atual',
  proposta: 'Projeto acústico proposto',
}
