import { requireLogin } from '@/lib/supabase/require-login'
import { CoberturaClient } from '@/components/cobertura/CoberturaClient'

export default async function CoberturaPage() {
  await requireLogin()
  return <CoberturaClient />
}
