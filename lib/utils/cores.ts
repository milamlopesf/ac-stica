import type { Etapa, StatusProjeto, StatusAtividade, Prioridade } from '@/lib/types/database'

interface CorConfig {
  label: string
  badge: string
  hex: string
}

export const CORES_ETAPA: Record<Etapa, CorConfig> = {
  DNN: { label: 'DNN', badge: 'bg-slate-100 text-slate-700 border-slate-300', hex: '#64748b' },
  EP: { label: 'EP', badge: 'bg-blue-100 text-blue-700 border-blue-300', hex: '#3b82f6' },
  AP: { label: 'AP', badge: 'bg-violet-100 text-violet-700 border-violet-300', hex: '#8b5cf6' },
  EX: { label: 'EX', badge: 'bg-orange-100 text-orange-700 border-orange-300', hex: '#f97316' },
  OBRA: { label: 'OBRA', badge: 'bg-amber-900/10 text-amber-900 border-amber-800', hex: '#78350f' },
  GARANTIA: { label: 'GARANTIA', badge: 'bg-teal-100 text-teal-700 border-teal-300', hex: '#14b8a6' },
}

export const CORES_STATUS: Record<StatusProjeto, CorConfig> = {
  'A Fazer': { label: 'A Fazer', badge: 'bg-gray-100 text-gray-700 border-gray-300', hex: '#6b7280' },
  'Em Andamento': { label: 'Em Andamento', badge: 'bg-amber-100 text-amber-700 border-amber-300', hex: '#f59e0b' },
  'Aguardando Terceiros': {
    label: 'Aguardando Terceiros',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    hex: '#6366f1',
  },
  'Concluído': { label: 'Concluído', badge: 'bg-green-100 text-green-700 border-green-300', hex: '#22c55e' },
  'Atrasado': { label: 'Atrasado', badge: 'bg-red-100 text-red-700 border-red-300', hex: '#ef4444' },
}

export const CORES_STATUS_ATIVIDADE: Record<StatusAtividade, CorConfig> = {
  pendente: { label: 'Pendente', badge: 'bg-gray-100 text-gray-700 border-gray-300', hex: '#6b7280' },
  andamento: { label: 'Em Andamento', badge: 'bg-amber-100 text-amber-700 border-amber-300', hex: '#f59e0b' },
  concluido: { label: 'Concluído', badge: 'bg-green-100 text-green-700 border-green-300', hex: '#22c55e' },
}

export const CORES_PRIORIDADE: Record<Prioridade, CorConfig> = {
  Baixa: { label: 'Baixa', badge: 'bg-gray-100 text-gray-700 border-gray-300', hex: '#6b7280' },
  Média: { label: 'Média', badge: 'bg-blue-100 text-blue-700 border-blue-300', hex: '#3b82f6' },
  Alta: { label: 'Alta', badge: 'bg-orange-100 text-orange-700 border-orange-300', hex: '#f97316' },
  Urgente: { label: 'Urgente', badge: 'bg-red-100 text-red-700 border-red-300', hex: '#ef4444' },
}

export const ORDEM_PRIORIDADE: Record<Prioridade, number> = {
  Urgente: 0,
  Alta: 1,
  Média: 2,
  Baixa: 3,
}

export const ETAPAS: Etapa[] = ['DNN', 'EP', 'AP', 'EX', 'OBRA', 'GARANTIA']
export const STATUS_PROJETO: StatusProjeto[] = [
  'A Fazer',
  'Em Andamento',
  'Aguardando Terceiros',
  'Concluído',
  'Atrasado',
]
export const STATUS_ATIVIDADE: StatusAtividade[] = ['pendente', 'andamento', 'concluido']
export const PRIORIDADES: Prioridade[] = ['Baixa', 'Média', 'Alta', 'Urgente']

export const PROJETISTAS_ACUSTICOS = [
  'Acústica e Sônica',
  'Akkerman & Alcoragi',
  'Giner',
  'Harmonia',
  'Interno',
]

export const DIRETORES = [
  'Alexandre Costa',
  'Alexandre Mirandez',
  'Andre Vergara',
  'Bruna Murolo',
  'Camila Masi',
  'Carlos Levada',
  'Carolina Fischer',
  'Daniel Giannella',
  'Daniel Ingarano',
  'Felipe Martins',
  'Fernanda Matos',
  'Fernando Camargo',
  'Francisco Vergamini',
  'Gilberto Gambagorte',
  'Guedes Alavarse',
  'Guilherme Titton',
  'Gustavo Vaughan',
  'Henrique Fernandes',
  'Ivan Patricio',
  'Jose Temperini',
  'Leonardo Leite',
  'Maria Cristina Bianchessi',
  'Maria Regina Ramos',
  'Marlon Oliveira',
  'Pamela Mello',
  'Pedro Coivo',
  'Rafael Gentil',
  'Rafael Venturi',
  'Regina Kitakawa',
  'Ricardo Cuminale',
  'Vinicius Lacerda',
  'Virginia Nehmi',
  'Wesley Pereira',
]
