'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Game, GamePhase } from '@/types'

const PHASE_LABELS: Record<GamePhase, string> = {
  group: 'Fase de grupos',
  round_of_32: '16-avos de final',
  round_of_16: 'Oitavas',
  quarter: 'Quartas',
  semi: 'Semi',
  final: 'Final',
}

const STATUS_LABELS = { upcoming: '⏳ Aguardando', open: '🔒 Palpites fechados', finished: '✅ Finalizado' }

// Jogos do Brasil na fase de grupos da Copa 2026 (Grupo C: Marrocos, Haiti, Escócia)
// Horários oficiais (Brasília, UTC-3)
const DEFAULT_GAMES = [
  { opponent: 'Marrocos', game_date: '2026-06-13T19:00:00-03:00', phase: 'group' as GamePhase },
  { opponent: 'Haiti', game_date: '2026-06-19T21:30:00-03:00', phase: 'group' as GamePhase },
  { opponent: 'Escócia', game_date: '2026-06-24T19:00:00-03:00', phase: 'group' as GamePhase },
]

export default function GamesClient({ games }: { games: Game[] }) {
  const router = useRouter()
  const [opponent, setOpponent] = useState('')
  const [gameDate, setGameDate] = useState('')
  const [phase, setPhase] = useState<GamePhase>('group')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!opponent.trim() || !gameDate) { setError('Adversário e data são obrigatórios.'); return }

    setLoading(true)
    const res = await fetch('/api/admin/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opponent: opponent.trim(), game_date: gameDate + ':00+01:00', phase }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Erro.'); return }
    setOpponent(''); setGameDate('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este jogo? Palpites ligados a ele também serão removidos.')) return
    setLoading(true)
    await fetch('/api/admin/games', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(false)
    router.refresh()
  }

  async function addDefaults() {
    setLoading(true)
    for (const g of DEFAULT_GAMES) {
      await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(g),
      })
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Pré-carregar fase de grupos */}
      {games.length === 0 && (
        <button
          onClick={addDefaults}
          disabled={loading}
          className="w-full border border-dashed border-yellow-600/40 text-yellow-500 text-sm py-3 rounded-xl hover:border-yellow-500 hover:bg-yellow-900/10 transition-colors"
        >
          ⚡ Pré-carregar 3 jogos da fase de grupos (datas provisórias)
        </button>
      )}

      {/* Formulário */}
      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-300">Adicionar jogo</p>
        <input
          type="text"
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="Adversário (ex: México)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
        />
        <input
          type="datetime-local"
          value={gameDate}
          onChange={(e) => setGameDate(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
        />
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as GamePhase)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-yellow-400 text-sm"
        >
          {Object.entries(PHASE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Adicionando...' : '+ Adicionar jogo'}
        </button>
      </form>

      {/* Lista de jogos */}
      <div className="space-y-2">
        {games.length === 0 && <p className="text-gray-500 text-sm text-center py-6">Nenhum jogo cadastrado.</p>}
        {games.map((g) => (
          <div key={g.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Brasil × {g.opponent}</p>
                <p className="text-xs text-gray-500">
                  {new Date(g.game_date).toLocaleString('pt-BR', {
                    weekday: 'short', day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda'
                  })} · {PHASE_LABELS[g.phase as GamePhase]}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{STATUS_LABELS[g.status]}</span>
                <button
                  onClick={() => handleDelete(g.id)}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  title="Remover jogo"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
