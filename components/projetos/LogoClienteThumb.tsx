'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'logos-clientes'

export function LogoClienteThumb({ caminho, className }: { caminho: string | null; className?: string }) {
  const supabase = createClient()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    if (!caminho) {
      setUrl(null)
      return
    }
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(caminho, 300)
      .then(({ data }) => {
        if (ativo) setUrl(data?.signedUrl ?? null)
      })
    return () => {
      ativo = false
    }
  }, [caminho, supabase])

  if (!url) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Logo do cliente" className={className ?? 'h-8 w-8 shrink-0 rounded object-contain'} />
}
