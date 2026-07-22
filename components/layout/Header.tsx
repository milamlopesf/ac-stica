import Link from 'next/link'
import { logout } from '@/app/login/actions'
import type { SessionInfo } from '@/lib/supabase/session'
import { NavLinks } from './NavLinks'

export function Header({ session }: { session: SessionInfo }) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/projetos" className="text-lg font-semibold text-gray-900">
            Painel Acústica
          </Link>
          {session.userId && <NavLinks />}
        </div>

        <div className="flex items-center gap-3">
          {session.userId ? (
            <>
              <span className="hidden text-sm text-gray-500 sm:inline">
                {session.email} · {session.isEditor ? 'editor' : 'viewer'}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
