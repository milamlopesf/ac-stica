import type { Etapa } from '@/lib/types/database'

export const ETAPAS_COM_CHECKLIST_PADRAO: Etapa[] = ['DNN', 'EP', 'AP', 'EX']

export const CHECKLIST_PADRAO: string[] = [
  'Análise de isolamento | Conferir vedações das salas',
  'Análise de isolamento | Conferir se há dutos e calhas passando entre salas',
  'Análise de isolamento | Conferir paredes encontrando em paredes existentes (Core/pilares/shafts)',
  'Análise de condicionamento | Conferir forros',
  'Análise de condicionamento | Conferir revestimentos de parede',
  'Análise de equipamentos | Conferir emissão de ruído das máquinas evaporadoras',
  'Análise de equipamentos | Conferir emissão de ruído dos ventiladores de ar externo',
  'Análise de equipamentos | Conferir posição e vedação das casas de máquinas',
]
