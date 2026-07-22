import Link from 'next/link'
import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; modo?: string; criado?: string }>
}) {
  const { erro, modo, criado } = await searchParams
  const criarConta = modo === 'criar'

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">
        {criarConta ? 'Criar conta' : 'Entrar'}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {criarConta
          ? 'Crie sua conta com o e-mail @awnet.com.br da empresa.'
          : 'Acesse com sua conta @awnet.com.br para ver o painel.'}
      </p>

      {criado && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          Conta criada! Se pedir confirmação, verifique seu e-mail e clique no link antes de entrar.
        </div>
      )}

      {erro && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : erro}
        </div>
      )}

      <form action={criarConta ? signup : login} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="voce@awnet.com.br"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={criarConta ? 6 : undefined}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {criarConta && <p className="text-xs text-gray-400">Mínimo de 6 caracteres.</p>}
        </div>

        <button
          type="submit"
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {criarConta ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <Link
        href={criarConta ? '/login' : '/login?modo=criar'}
        className="mt-4 text-center text-sm text-blue-600 hover:underline"
      >
        {criarConta ? 'Já tenho conta, entrar' : 'Ainda não tenho conta, criar'}
      </Link>
    </div>
  )
}
