export type Etapa = 'DNN' | 'EP' | 'AP' | 'EX' | 'OBRA' | 'GARANTIA'

export type StatusProjeto = 'A Fazer' | 'Em Andamento' | 'Concluído' | 'Atrasado'

export type StatusAtividade = 'pendente' | 'andamento' | 'concluido'

export type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Urgente'

export type Role = 'viewer' | 'editor'

export type Projeto = {
  id: string
  nome: string
  etapa: Etapa
  status: StatusProjeto
  entrega: string | null
  diretor: string | null
  gerente: string | null
  projetista: string | null
  projeto_vinculado_id: string | null
  created_at: string
}

export type Atividade = {
  id: string
  projeto_id: string | null
  texto: string
  status: StatusAtividade
  prioridade: Prioridade | null
  data_vencimento: string | null
  progresso: number
  etapa: Etapa | null
  diretor: string | null
  gerente: string | null
  projetista: string | null
  created_at: string
}

export type Nota = {
  id: string
  projeto_id: string | null
  texto: string
  created_at: string
}

export type Reuniao = {
  id: string
  projeto_id: string | null
  titulo: string
  data: string
  conteudo: string | null
  created_at: string
}

export type Anexo = {
  id: string
  projeto_id: string | null
  nome_arquivo: string
  caminho_storage: string
  tamanho_bytes: number | null
  created_at: string
}

export type HistoricoEtapa = {
  id: string
  projeto_id: string | null
  etapa_anterior: Etapa | null
  etapa_nova: Etapa
  created_at: string
}

export type Profile = {
  id: string
  email: string | null
  role: Role
}

export type CategoriaBiblioteca = 'normas' | 'planilhas' | 'laudos'

export type ItemBiblioteca = {
  id: string
  categoria: CategoriaBiblioteca
  titulo: string
  descricao: string | null
  fornecedor: string | null
  rw: string | null
  modelo: string | null
  subcategoria: string | null
  nome_arquivo: string
  caminho_storage: string
  tamanho_bytes: number | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      projetos: {
        Row: Projeto
        Insert: {
          id?: string
          nome: string
          etapa: Etapa
          status: StatusProjeto
          entrega?: string | null
          diretor?: string | null
          gerente?: string | null
          projetista?: string | null
          projeto_vinculado_id?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Projeto, 'id' | 'created_at'>>
        Relationships: []
      }
      atividades: {
        Row: Atividade
        Insert: {
          id?: string
          projeto_id?: string | null
          texto: string
          status?: StatusAtividade
          prioridade?: Prioridade | null
          data_vencimento?: string | null
          progresso?: number
          etapa?: Etapa | null
          diretor?: string | null
          gerente?: string | null
          projetista?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Atividade, 'id' | 'created_at'>>
        Relationships: []
      }
      notas: {
        Row: Nota
        Insert: {
          id?: string
          projeto_id?: string | null
          texto: string
          created_at?: string
        }
        Update: Partial<Omit<Nota, 'id' | 'created_at'>>
        Relationships: []
      }
      reunioes: {
        Row: Reuniao
        Insert: {
          id?: string
          projeto_id?: string | null
          titulo: string
          data: string
          conteudo?: string | null
          created_at?: string
        }
        Update: Partial<Omit<Reuniao, 'id' | 'created_at'>>
        Relationships: []
      }
      anexos: {
        Row: Anexo
        Insert: {
          id?: string
          projeto_id?: string | null
          nome_arquivo: string
          caminho_storage: string
          tamanho_bytes?: number | null
          created_at?: string
        }
        Update: Partial<Omit<Anexo, 'id' | 'created_at'>>
        Relationships: []
      }
      projeto_historico_etapa: {
        Row: HistoricoEtapa
        Insert: {
          id?: string
          projeto_id?: string | null
          etapa_anterior?: Etapa | null
          etapa_nova: Etapa
          created_at?: string
        }
        Update: Partial<Omit<HistoricoEtapa, 'id' | 'created_at'>>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Profile
        Update: Partial<Omit<Profile, 'id'>>
        Relationships: []
      }
      biblioteca: {
        Row: ItemBiblioteca
        Insert: {
          id?: string
          categoria: CategoriaBiblioteca
          titulo: string
          descricao?: string | null
          fornecedor?: string | null
          rw?: string | null
          modelo?: string | null
          subcategoria?: string | null
          nome_arquivo: string
          caminho_storage: string
          tamanho_bytes?: number | null
          created_at?: string
        }
        Update: Partial<Omit<ItemBiblioteca, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
