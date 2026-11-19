import type { createClient } from '@/lib/supabase/client'

export function normalizarNomePessoa(nome: string): string {
  return nome.trim().toLowerCase()
}

// Mapa normalizado (nome -> caminho da foto no bucket fotos-equipe), usado
// pra casar diretor/gerente (campos livres em projetos) com o cadastro de
// equipe. Nomes sem foto cadastrada simplesmente não entram no mapa.
export async function buscarFotosEquipe(
  supabase: ReturnType<typeof createClient>
): Promise<Map<string, string>> {
  const { data } = await supabase.from('pessoas_equipe').select('nome, foto_storage')
  const mapa = new Map<string, string>()
  for (const p of data ?? []) {
    if (p.foto_storage) mapa.set(normalizarNomePessoa(p.nome), p.foto_storage)
  }
  return mapa
}
