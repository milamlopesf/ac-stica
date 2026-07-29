import Link from 'next/link'
import { logout } from '@/app/login/actions'
import type { SessionInfo } from '@/lib/supabase/session'
import { NavLinks } from './NavLinks'

export function Header({ session }: { session: SessionInfo }) {
  return (
    <header className="bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-800 shadow-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/projetos" className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-400/90 text-sm font-bold text-teal-950">
            PA
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-white">Painel Acústica</span>
            <span className="hidden text-xs text-teal-100/70 sm:inline">
              Acompanhamento de projetos acústicos
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {session.userId ? (
            <>
              <span className="hidden text-sm text-teal-100/80 sm:inline">
                {session.email} · {session.isEditor ? 'editor' : 'viewer'}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Sair
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-teal-400 px-3 py-1.5 text-sm font-medium text-teal-950 hover:bg-teal-300"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>

      {session.userId && (
        <div className="border-t border-white/10 bg-white">
          <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <NavLinks isEditor={session.isEditor} />
          </div>
        </div>
      )}
    </header>
  )
}
