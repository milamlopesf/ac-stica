import Link from 'next/link'
import { logout } from '@/app/login/actions'
import type { SessionInfo } from '@/lib/supabase/session'
import { NavLinks } from './NavLinks'

export function Header({ session }: { session: SessionInfo }) {
  return (
    <header className="bg-cyan-50 border-b border-teal-900/10">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/projetos" className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-teal-700">AW</span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-gray-900">Painel Acústica</span>
            <span className="hidden text-xs text-gray-500 sm:inline">
              Acompanhamento de projetos acústicos
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {session.userId ? (
            <>
              <span className="hidden text-sm text-gray-500 sm:inline">
                {session.email} · {session.isEditor ? 'editor' : 'viewer'}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {session.userId && (
        <div className="border-t border-teal-900/10 bg-white">
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <NavLinks isEditor={session.isEditor} />
          </div>
        </div>
      )}
    </header>
  )
}
