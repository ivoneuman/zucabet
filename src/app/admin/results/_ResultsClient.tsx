'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Game, FirstGoalType } from '@/types'

interface Props {
  games: Game[]
  betAmount: number
  accumulated: number
}

export default function ResultsClient({ games, betAmount, accumulated }: Props) {
  const router = useRouter()
  const pendingGames = games.filter((g) => g.status !== 'finished')
  const finishedGames = games.filter((g) => g.status === 'finished')

  return (
    <div className="space-y-6">
      {pendingGames.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-8">Todos os jogos foram finalizados.</p>
      )}
      {pendingGames.map((g) => (
        <ResultForm key={g.id} game={g} betAmount={betAmount} accumulated={accumulated} onSaved={() => router.refresh()} />
      ))}

      {finishedGames.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Finalizados</p>
          <div className="space-y-2">
            {finishedGames.map((g) => (
              <div key={g.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <p className="font-medium text-white">
                  Brasil {g.brazil_goals} × {g.opponent_goals} {g.opponent} ✅
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(g.game_date).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    timeZone: 'Africa/Luanda'
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ResultForm({ game, betAmount, accumulated, onSaved }: {
  game: Game
  betAmount: number
  accumulated: number
  onSaved: () => void
}) {
  const [brazilGoals, setBrazilGoals] = useState(0)
  const [oppGoals, setOppGoals] = useState(0)
  const [firstGoalType, setFirstGoalType] = useState<FirstGoalType>('player')
  const [firstGoalPlayer, setFirstGoalPlayer] = useState('')
  const [varAnnulled, setVarAnnulled] = useState(false)
  const [penalty, setPenalty] = useState(false)
  const [headerGoal, setHeaderGoal] = useState(false)
  const [yellowCards, setYellowCards] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!window.confirm(`Confirmar resultado: Brasil ${brazilGoals} × ${oppGoals} ${game.opponent}?\nEsta ação calcula pontos e ajusta o pote.`)) return

    setLoading(true)
    const res = await fetch('/api/admin/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: game.id,
        brazil_goals: brazilGoals,
        opponent_goals: oppGoals,
        first_goal_type: firstGoalType,
        first_goal_player: firstGoalType === 'player' ? firstGoalPlayer : null,
        var_annulled: varAnnulled,
        penalty,
        header_goal: headerGoal,
        brazil_yellow_cards: yellowCards,
        bet_amount: betAmount,
        accumulated,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Erro.'); return }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-yellow-900/30 rounded-2xl p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-yellow-400 mb-1">Brasil × {game.opponent}</p>
        <p className="text-xs text-gray-500">
          {new Date(game.game_date).toLocaleString('pt-BR', {
            weekday: 'short', day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda'
          })}
        </p>
      </div>

      {/* Placar */}
      <div className="flex items-center gap-6">
        <NumInput label="🇧🇷 Brasil" value={brazilGoals} onChange={setBrazilGoals} />
        <span className="text-gray-600 font-bold text-xl">×</span>
        <NumInput label={game.opponent} value={oppGoals} onChange={setOppGoals} />
      </div>

      {/* Primeiro gol */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Primeiro gol do Brasil</p>
        <div className="flex gap-2 flex-wrap">
          {(['player', 'own_goal', 'no_goal'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setFirstGoalType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${firstGoalType === t ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-gray-400'}`}>
              {t === 'player' ? '⚽ Jogador' : t === 'own_goal' ? '🙈 Gol contra' : '🚫 Sem gol'}
            </button>
          ))}
        </div>
        {firstGoalType === 'player' && (
          <input type="text" value={firstGoalPlayer} onChange={(e) => setFirstGoalPlayer(e.target.value)}
            placeholder="Nome do jogador"
            className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-400" />
        )}
      </div>

      {/* Bools */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Gol anulado (VAR)?', value: varAnnulled, set: setVarAnnulled },
          { label: 'Pênalti?', value: penalty, set: setPenalty },
          { label: 'Gol de cabeça?', value: headerGoal, set: setHeaderGoal },
        ].map(({ label, value, set }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-2">{label}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => set(true)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium ${value ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>Sim</button>
              <button type="button" onClick={() => set(false)}
                className={`flex-1 py-1 rounded-lg text-xs font-medium ${!value ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'}`}>Não</button>
            </div>
          </div>
        ))}
        <div className="bg-gray-800 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-2">Cartões amarelos Brasil</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setYellowCards(Math.max(0, yellowCards - 1))}
              className="w-8 h-8 bg-gray-700 rounded-lg text-white font-bold">−</button>
            <span className="text-white font-bold text-lg w-6 text-center">{yellowCards}</span>
            <button type="button" onClick={() => setYellowCards(yellowCards + 1)}
              className="w-8 h-8 bg-gray-700 rounded-lg text-white font-bold">+</button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
        {loading ? 'Salvando...' : '✅ Lançar resultado e calcular pontos'}
      </button>
    </form>
  )
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 bg-gray-800 rounded-lg text-white font-bold">−</button>
        <span className="text-2xl font-black text-white w-6 text-center">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-8 h-8 bg-gray-800 rounded-lg text-white font-bold">+</button>
      </div>
    </div>
  )
}
