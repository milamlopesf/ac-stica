import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types/database'

export interface SessionInfo {
  userId: string | null
  email: string | null
  role: 'viewer' | 'editor'
  isEditor: boolean
}

export async function getSessionInfo(): Promise<SessionInfo> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, email: null, role: 'viewer', isEditor: false }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const role = profile?.role ?? 'viewer'

  return { userId: user.id, email: user.email ?? null, role, isEditor: role === 'editor' }
}
