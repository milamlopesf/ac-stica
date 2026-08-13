import type { SupabaseClient } from '@supabase/supabase-js'

export const BUCKET_IMAGENS_EDITOR = 'editor-imagens'
const VALIDADE_URL_SEGUNDOS = 60 * 60

export async function enviarImagemEditor(supabase: SupabaseClient, pasta: string, arquivo: File) {
  const extensao = arquivo.name.split('.').pop()?.toLowerCase() || 'png'
  const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`
  const { error } = await supabase.storage.from(BUCKET_IMAGENS_EDITOR).upload(caminho, arquivo)
  if (error) throw error
  return caminho
}

export async function urlAssinadaImagemEditor(supabase: SupabaseClient, caminho: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_IMAGENS_EDITOR)
    .createSignedUrl(caminho, VALIDADE_URL_SEGUNDOS)
  if (error || !data) throw error ?? new Error('Falha ao gerar URL da imagem')
  return data.signedUrl
}
