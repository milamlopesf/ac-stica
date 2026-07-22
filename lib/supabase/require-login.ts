import { redirect } from 'next/navigation'
import { getSessionInfo } from '@/lib/supabase/session'

export async function requireLogin() {
  const session = await getSessionInfo()
  if (!session.userId) {
    redirect('/login')
  }
  return session
}
