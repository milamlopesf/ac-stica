'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function FotoStorageThumb({
  bucket,
  caminho,
  alt,
  className,
}: {
  bucket: string
  caminho: string | null
  alt: string
  className?: string
}) {
  const supabase = createClient()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    if (!caminho) {
      setUrl(null)
      return
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(caminho, 300)
      .then(({ data }) => {
        if (ativo) setUrl(data?.signedUrl ?? null)
      })
    return () => {
      ativo = false
    }
  }, [bucket, caminho, supabase])

  if (!url) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} />
}
