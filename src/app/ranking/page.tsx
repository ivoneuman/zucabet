import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Bet, Game, Participant, RankingEntry } from '@/types'
import Link from 'next/link'
import LogoutButton from '@/app/_components/LogoutButton'

async function getRanking(): Promise<RankingEntry[]> {
  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, is_admin, created_at')
    .order('name')

  if (!participants) return []

  const { data: bets } = await supabase
    .from('bets')
    .select('participant_id, points, brazil_goals, opponent_goals, game_id')

  const { data: games } = await supabase
    .from('games')
    .select('id, brazil_goals, opponent_goals')
    .eq('status', 'finished')

  const finishedGameIds = new Set((games ?? []).map((g: Pick<Game, 'id'>) => g.id))

  const ranking: RankingEntry[] = participants.map((p: Participant) => {
    const myBets = (bets ?? []).filter(
      (b: Pick<Bet, 'participant_id' | 'points' | 'brazil_goals' | 'opponent_goals' | 'game_id'>) =>
        b.participant_id === p.id && finishedGameIds.has(b.game_id)
    )
    const total = myBets.reduce((sum: number, b: typeof myBets[0]) => sum + (b.points ?? 0), 0)
    const exactScores = myBets.filter((b: typeof myBets[0]) => {
      const game = (games ?? []).find((g: Pick<Game, 'id'>) => g.id === b.game_id)
      return (
        game &&
        game.brazil_goals !== null &&
        b.brazil_goals === game.brazil_goals &&
        b.opponent_goals === game.opponent_goals
      )
    }).length

    return {
      participant: p,
      total_points: total,
      bets_count: myBets.length,
      exact_scores: exactScores,
    }
  })

  return ranking.sort((a, b) => b.total_points - a.total_points)
}

async function getNextGame(): Promise<Game | null> {
  const { data } = await supabase
    .from('games')
    .select('*')
    .in('status', ['upcoming', 'open'])
    .order('game_date', { ascending: true })
    .limit(1)
    .single()
  return data
}

async function getPot(): Promise<number> {
  const { data } = await supabase.from('pot_state').select('accumulated').single()
  return data?.accumulated ?? 0
}

export default async function RankingPage() {
  const session = await getSession()
  const [ranking, nextGame, pot] = await Promise.all([getRanking(), getNextGame(), getPot()])

  const betAmount = parseInt(process.env.NEXT_PUBLIC_BET_AMOUNT ?? '10000')
  const numParticipants = ranking.length
  const potTotal = pot + betAmount * numParticipants

  const now = new Date()
  const canBet =
    nextGame !== null &&
    nextGame.status === 'upcoming' &&
    new Date(nextGame.game_date).getTime() - now.getTime() > 5 * 60 * 1000

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-black text-yellow-400">ZUCA BET 🇧🇷</h1>
          <p className="text-gray-400 text-xs">Olá, {session?.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          {session?.is_admin && (
            <Link href="/admin" className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors">
              Admin
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>

      {/* Próximo jogo / Palpite */}
      {nextGame && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Próximo jogo</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg">Brasil 🆚 {nextGame.opponent}</p>
              <p className="text-gray-400 text-sm">
                {new Date(nextGame.game_date).toLocaleString('pt-BR', {
                  weekday: 'short', day: '2-digit', month: '2-digit',
                  hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda'
                })}
              </p>
            </div>
            {canBet ? (
              <Link
                href="/bet"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                Palpitar
              </Link>
            ) : (
              <span className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-xl">
                {nextGame.status === 'open' ? 'Palpites fechados' : 'Aguardando...'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pote */}
      <div className="bg-gradient-to-r from-green-900/40 to-yellow-900/20 border border-yellow-900/40 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Pote acumulado</p>
          <p className="text-2xl font-black text-yellow-400">
            Kz {pot.toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="text-3xl">💰</div>
      </div>

      {/* Ranking */}
      <div>
        <h2 className="text-lg font-bold text-gray-200 mb-3">Ranking Geral</h2>
        {ranking.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Nenhum jogo finalizado ainda.</p>
        ) : (
          <div className="space-y-2">
            {ranking.map((entry, i) => (
              <div
                key={entry.participant.id}
                className={`flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3 border ${
                  i === 0 ? 'border-yellow-500/50' : 'border-gray-800'
                }`}
              >
                <span className={`text-lg font-black w-7 text-center ${
                  i === 0 ? 'text-yellow-400' :
                  i === 1 ? 'text-gray-300' :
                  i === 2 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{entry.participant.name}</p>
                  <p className="text-xs text-gray-500">
                    {entry.bets_count} palpite{entry.bets_count !== 1 ? 's' : ''} ·{' '}
                    {entry.exact_scores} placar{entry.exact_scores !== 1 ? 'es' : ''} exato{entry.exact_scores !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className="font-black text-xl text-white">{entry.total_points}</span>
                <span className="text-xs text-gray-500">pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
