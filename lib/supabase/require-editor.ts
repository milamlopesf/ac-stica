import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/supabase/session'

export async function requireEditor() {
  const session = await getSessionInfo()
  if (!session.isEditor) {
    redirect('/projetos')
  }
  return session
}
