'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const DOMINIO_PERMITIDO = '@awnet.com.br'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email.endsWith(DOMINIO_PERMITIDO)) {
    redirect(`/login?modo=criar&erro=${encodeURIComponent(`Use um e-mail ${DOMINIO_PERMITIDO} para criar a conta.`)}`)
  }

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(`/login?modo=criar&erro=${encodeURIComponent(error.message)}`)
  }

  if (data.session) {
    revalidatePath('/', 'layout')
    redirect('/projetos')
  }

  redirect('/login?criado=1')
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?erro=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/projetos')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/projetos')
}
