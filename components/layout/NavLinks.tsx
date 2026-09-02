'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import type { SVGProps } from 'react'

function IconProjetos(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M3 21V7l9-4 9 4v14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCalendario(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function IconLivro(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlanilha(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 10v10" strokeLinecap="round" />
    </svg>
  )
}

function IconLaudo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  )
}

function IconPaineis(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M4 19V10M12 19V5M20 19v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCobertura(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M9 12.5 11.5 15 16 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3 4 6.5v5c0 5 3.4 8.7 8 9.5 4.6-.8 8-4.5 8-9.5v-5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NavLinks({ isEditor }: { isEditor: boolean }) {
  const pathname = usePathname()

  const links = [
    { href: '/projetos', label: 'Projetos', icon: IconProjetos, apenasEditor: false },
    { href: '/calendario', label: 'Calendário', icon: IconCalendario, apenasEditor: true },
    { href: '/normas', label: 'Normas/Manuais', icon: IconLivro, apenasEditor: false },
    { href: '/planilhas', label: 'Planilhas de Cálculo', icon: IconPlanilha, apenasEditor: true },
    { href: '/laudos', label: 'Laudos/Medições', icon: IconLaudo, apenasEditor: false },
    { href: '/paineis', label: 'Painéis', icon: IconPaineis, apenasEditor: false },
    { href: '/cobertura', label: 'Cobertura', icon: IconCobertura, apenasEditor: false },
  ].filter((link) => !link.apenasEditor || isEditor)

  return (
    <nav className="flex flex-wrap items-center gap-1 py-2">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href)
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
              active
                ? 'bg-gray-100 text-gray-900 shadow-inner'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
