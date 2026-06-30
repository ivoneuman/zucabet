import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Bet, FirstGoalType, Participant } from '@/types'

function firstGoalLabel(type: FirstGoalType | null, player: string | null) {
  if (type === 'player') return player || 'Jogador'
  if (type === 'own_goal') return 'Gol contra'
  if (type === 'no_goal') return 'Sem gol'
  return '—'
}

export default async function GameBetsPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { data: game } = await supabase.from('games').select('*').eq('id', params.id).single()

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-300 font-semibold">Jogo não encontrado.</p>
          <Link href="/ranking" className="text-yellow-400 text-sm mt-3 inline-block hover:underline">← Voltar ao ranking</Link>
        </div>
      </div>
    )
  }

  const now = new Date()
  const minutesUntil = (new Date(game.game_date).getTime() - now.getTime()) / 60000
  const closed = game.status === 'finished' || minutesUntil <= 5

  if (!closed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🤫</div>
          <p className="text-gray-300 font-semibold">Palpites ainda não revelados.</p>
          <p className="text-gray-500 text-sm mt-1">Eles aparecem aqui depois que o prazo de palpite encerrar.</p>
          <Link href="/ranking" className="text-yellow-400 text-sm mt-3 inline-block hover:underline">← Voltar ao ranking</Link>
        </div>
      </div>
    )
  }

  const { data: bets } = await supabase.from('bets').select('*').eq('game_id', game.id)
  const { data: participants } = await supabase.from('participants').select('id, name')

  const rows = ((participants ?? []) as Pick<Participant, 'id' | 'name'>[])
    .map((p) => ({ participant: p, bet: (bets ?? []).find((b: Bet) => b.participant_id === p.id) as Bet | undefined }))
    .sort((a, b) => a.participant.name.localeCompare(b.participant.name))

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between pt-2">
        <Link href="/ranking" className="text-gray-400 hover:text-white text-sm transition-colors">← Ranking</Link>
        <p className="text-xs text-gray-500">Olá, {session.name}</p>
      </header>

      <div>
        <h1 className="text-xl font-black text-yellow-400">Palpites: Brasil 🆚 {game.opponent}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date(game.game_date).toLocaleString('pt-BR', {
            weekday: 'short', day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda'
          })}
          {game.status === 'finished' && ` · Resultado: Brasil ${game.brazil_goals} × ${game.opponent_goals}`}
        </p>
      </div>

      <div className="space-y-2">
        {rows.map(({ participant, bet }) => (
          <div key={participant.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <p className="font-semibold text-white">{participant.name}</p>
            {bet ? (
              <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <span>⚽ Brasil {bet.brazil_goals} × {bet.opponent_goals} {game.opponent}</span>
                <span>🥇 1º gol: {firstGoalLabel(bet.first_goal_type, bet.first_goal_player)}</span>
                <span>🚫 VAR: {bet.var_annulled ? 'Sim' : 'Não'}</span>
                <span>⚠️ Pênalti: {bet.penalty ? 'Sim' : 'Não'}</span>
                <span>🤕 Cabeçada: {bet.header_goal ? 'Sim' : 'Não'}</span>
                <span>🟨 Cartões BR: {bet.brazil_yellow_cards}</span>
                <span>⏱️ Prorrogação: {bet.overtime ? 'Sim' : 'Não'}</span>
                <span>🥅 Pênaltis: {bet.penalty_shootout ? 'Sim' : 'Não'}</span>
                {game.status === 'finished' && bet.points !== null && (
                  <span className="text-yellow-400">🏆 {bet.points} pts</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Não palpitou.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
