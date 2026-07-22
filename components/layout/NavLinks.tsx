'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export function NavLinks() {
  const pathname = usePathname()

  const links = [
    { href: '/projetos', label: 'Projetos' },
    { href: '/atividades', label: 'Atividades' },
    { href: '/calendario', label: 'Calendário' },
    { href: '/normas', label: 'Normas/Manuais' },
    { href: '/planilhas', label: 'Planilhas de Cálculo' },
    { href: '/laudos', label: 'Laudos/Medições' },
    { href: '/paineis', label: 'Painéis' },
  ]

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
