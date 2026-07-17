import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { getSessionInfo } from '@/lib/supabase/session'

export const metadata: Metadata = {
  title: 'Painel Acústica',
  description: 'Acompanhamento de projetos acústicos',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSessionInfo()

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="app-background flex min-h-full flex-col text-gray-900">
        <Header session={session} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  )
}
