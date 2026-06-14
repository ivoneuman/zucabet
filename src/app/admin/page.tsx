import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function AdminDashboard() {
  const [
    { count: participants },
    { count: games },
    { count: finished },
    { data: pot },
  ] = await Promise.all([
    supabase.from('participants').select('id', { count: 'exact', head: true }),
    supabase.from('games').select('id', { count: 'exact', head: true }),
    supabase.from('games').select('id', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('pot_state').select('accumulated').single(),
  ])

  const stats = [
    { label: 'Participantes', value: participants ?? 0, icon: '👥', href: '/admin/participants' },
    { label: 'Jogos cadastrados', value: games ?? 0, icon: '📅', href: '/admin/games' },
    { label: 'Jogos finalizados', value: finished ?? 0, icon: '✅', href: '/admin/results' },
    { label: 'Pote acumulado (Kz)', value: (pot?.accumulated ?? 0).toLocaleString('pt-BR'), icon: '💰', href: '/admin/results' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-200">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-600 transition-colors"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
