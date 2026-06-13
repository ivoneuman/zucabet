import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LogoutButton from '@/app/_components/LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.is_admin) redirect('/ranking')

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4">
      <header className="flex items-center justify-between pt-2 mb-6">
        <div>
          <h1 className="text-xl font-black text-yellow-400">ZUCA BET · Admin</h1>
          <p className="text-gray-500 text-xs">{session.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/ranking" className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors">
            Ver site
          </Link>
          <LogoutButton />
        </div>
      </header>

      <nav className="flex gap-2 mb-6 flex-wrap">
        {[
          { href: '/admin', label: '🏠 Dashboard' },
          { href: '/admin/participants', label: '👥 Participantes' },
          { href: '/admin/games', label: '📅 Jogos' },
          { href: '/admin/results', label: '⚽ Resultados' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-xl transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
