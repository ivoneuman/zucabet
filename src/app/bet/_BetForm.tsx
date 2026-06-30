'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Bet, Game, FirstGoalType } from '@/types'

interface Props {
  game: Game
  participantId: string
  existingBet: Bet | null
}

export default function BetForm({ game, participantId, existingBet }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [brazilGoals, setBrazilGoals] = useState(existingBet?.brazil_goals ?? 1)
  const [oppGoals, setOppGoals] = useState(existingBet?.opponent_goals ?? 0)
  const [firstGoalType, setFirstGoalType] = useState<FirstGoalType>(existingBet?.first_goal_type ?? 'player')
  const [firstGoalPlayer, setFirstGoalPlayer] = useState(existingBet?.first_goal_player ?? '')
  const [varAnnulled, setVarAnnulled] = useState(existingBet?.var_annulled ?? false)
  const [penalty, setPenalty] = useState(existingBet?.penalty ?? false)
  const [headerGoal, setHeaderGoal] = useState(existingBet?.header_goal ?? false)
  const [yellowCards, setYellowCards] = useState(existingBet?.brazil_yellow_cards ?? 0)
    const [overtime, setOvertime] = useState(existingBet?.overtime ?? false)
    const [penaltyShootout, setPenaltyShootout] = useState(existingBet?.penalty_shootout ?? false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (firstGoalType === 'player' && !firstGoalPlayer.trim()) {
      setError('Informe o nome do jogador que fará o primeiro gol.')
      return
    }

    setLoading(true)

    const payload = {
      participant_id: participantId,
      game_id: game.id,
      brazil_goals: brazilGoals,
      opponent_goals: oppGoals,
      first_goal_type: firstGoalType,
      first_goal_player: firstGoalType === 'player' ? firstGoalPlayer.trim() : null,
      var_annulled: varAnnulled,
      penalty,
      header_goal: headerGoal,
      brazil_yellow_cards: yellowCards,
    }

    const res = await fetch('/api/bets', {
      method: existingBet ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar palpite.')
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/ranking'), 1500)
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-xl font-bold text-green-400">Palpite salvo!</p>
        <p className="text-gray-400 text-sm mt-1">Redirecionando...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Placar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <p className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Placar</p>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">🇧🇷 Brasil</p>
            <NumberInput value={brazilGoals} onChange={setBrazilGoals} min={0} max={20} />
          </div>
          <span className="text-2xl text-gray-600 font-bold">×</span>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">{game.opponent}</p>
            <NumberInput value={oppGoals} onChange={setOppGoals} min={0} max={20} />
          </div>
        </div>
      </div>

      {/* Primeiro gol do Brasil */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Primeiro gol do Brasil</p>
        <div className="flex gap-2 flex-wrap">
          {(['player', 'own_goal', 'no_goal'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFirstGoalType(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                firstGoalType === t
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t === 'player' ? '⚽ Jogador' : t === 'own_goal' ? '🙈 Gol contra' : '🚫 Sem gol'}
            </button>
          ))}
        </div>
        {firstGoalType === 'player' && (
          <input
            type="text"
            value={firstGoalPlayer}
            onChange={(e) => setFirstGoalPlayer(e.target.value)}
            placeholder="Nome do jogador"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
        )}
      </div>

      {/* Perguntas bônus */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Bônus de 1 ponto cada</p>

        <BoolField
          label="Haverá gol anulado pelo VAR?"
          value={varAnnulled}
          onChange={setVarAnnulled}
        />
        <BoolField
          label="Haverá cobrança de pênalti?"
          value={penalty}
          onChange={setPenalty}
        />
        <BoolField
          label="Haverá gol de cabeça?"
          value={headerGoal}
          onChange={setHeaderGoal}
        />

        {/* Cartões amarelos */}
        <div>
          <p className="text-sm text-gray-300 mb-2">Cartões amarelos do Brasil</p>
          <NumberInput value={yellowCards} onChange={setYellowCards} min={0} max={11} />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-black py-4 rounded-2xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvando...' : existingBet ? 'Atualizar palpite' : 'Confirmar palpite'}
      </button>
    </form>
  )
}

function NumberInput({
  value, onChange, min, max,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition-colors"
      >
        −
      </button>
      <span className="text-3xl font-black text-white w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition-colors"
      >
        +
      </button>
    </div>
  )
}

function BoolField({
  label, value, onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            value ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !value ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          Não
        </button>
      </div>
    </div>
  )
}
