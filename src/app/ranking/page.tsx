import { getCountryFlag } from '@/lib/flags'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateScore } from '@/lib/scoring'
import type { Bet, Game, Participant, RankingEntry, ScoreBreakdown } from '@/types'
import Link from 'next/link'
import LogoutButton from '@/app/_components/LogoutButton'

function emptyBreakdown(): ScoreBreakdown {
  return { result: 0, brazil_goals: 0, opp_goals: 0, exact_bonus: 0, first_goal: 0, var: 0, penalty: 0, header: 0, yellow_cards: 0, overtime: 0, penalty_shootout: 0, total: 0 }
}

async function getRanking(): Promise<RankingEntry[]> {
  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, is_admin, created_at')
    .order('name')

  if (!participants) return []

  const { data: bets } = await supabase.from('bets').select('*')

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'finished')

  const finishedGames = (games ?? []) as Game[]
  const finishedGameIds = new Set(finishedGames.map((g) => g.id))

  const ranking: RankingEntry[] = participants.map((p: Participant) => {
    const myBets = (bets ?? []).filter(
      (b: Bet) => b.participant_id === p.id && finishedGameIds.has(b.game_id)
    )
    const total = myBets.reduce((sum: number, b: Bet) => sum + (b.points ?? 0), 0)
    const exactScores = myBets.filter((b: Bet) => {
      const game = finishedGames.find((g) => g.id === b.game_id)
      return (
        game &&
        game.brazil_goals !== null &&
        b.brazil_goals === game.brazil_goals &&
        b.opponent_goals === game.opponent_goals
      )
    }).length

    const breakdown = myBets.reduce((acc: ScoreBreakdown, b: Bet) => {
      const game = finishedGames.find((g) => g.id === b.game_id)
      if (!game) return acc
      const bd = calculateScore(b, game)
      for (const key of Object.keys(acc) as (keyof ScoreBreakdown)[]) {
        acc[key] += bd[key]
      }
      return acc
    }, emptyBreakdown())

    return {
      participant: p,
      total_points: total,
      bets_count: myBets.length,
      exact_scores: exactScores,
      breakdown,
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

async function getAllGames(): Promise<Game[]> {
  const { data } = await supabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: true })
  return (data ?? []) as Game[]
}

async function getMyBet(participantId: string, gameId: string): Promise<Bet | null> {
  const { data } = await supabase
    .from('bets')
    .select('*')
    .eq('participant_id', participantId)
    .eq('game_id', gameId)
    .single()
  return data
}

async function getPot(): Promise<number> {
  const { data } = await supabase.from('pot_state').select('accumulated').single()
  return data?.accumulated ?? 0
}

async function getExactWinners(games: Game[]): Promise<Record<string, string[]>> {
  const finishedGames = games.filter((g) => g.status === 'finished')
  if (finishedGames.length === 0) return {}
  const finishedIds = finishedGames.map((g) => g.id)
  const { data: bets } = await supabase
    .from('bets')
    .select('game_id, brazil_goals, opponent_goals, participants(name)')
    .in('game_id', finishedIds)
  const result: Record<string, string[]> = {}
  for (const game of finishedGames) {
    result[game.id] = (bets ?? [])
      .filter(
        (b: any) =>
          b.game_id === game.id &&
          b.brazil_goals === game.brazil_goals &&
          b.opponent_goals === game.opponent_goals
      )
      .map((b: any) => b.participants?.name ?? '?')
  }
  return result
}

export default async function RankingPage() {
  const session = await getSession()
  const [ranking, nextGame, pot, allGames] = await Promise.all([getRanking(), getNextGame(), getPot(), getAllGames()])
  const exactWinners = await getExactWinners(allGames)

  const myNextBet = nextGame && session ? await getMyBet(session.id, nextGame.id) : null

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
          <Link href="/regras" className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-300 transition-colors">
            📜 Regras
          </Link>
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
              <p className="font-bold text-lg">🇧🇷 Brasil 🆚 {getCountryFlag(nextGame.opponent)} {nextGame.opponent}</p>
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
                {myNextBet ? 'Editar palpite' : 'Palpitar'}
              </Link>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-xl">
                  Palpites fechados
                </span>
                <Link href={`/games/${nextGame.id}/bets`} className="text-xs text-yellow-400 hover:underline">
                  👀 Ver palpites
                </Link>
              </div>
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

      {/* Jogos */}
      <div>
        <h2 className="text-lg font-bold text-gray-200 mb-3">Jogos</h2>
        <div className="space-y-2">
          {allGames.map((g) => {
            const gameTime = new Date(g.game_date)
            const minutesUntil = (gameTime.getTime() - now.getTime()) / 60000
            const closed = g.status === 'finished' || minutesUntil <= 5
            return (
              <div key={g.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    🇧🇷 Brasil 🆚 {getCountryFlag(g.opponent)} {g.opponent}
                    {g.status === 'finished' && ` · ${g.brazil_goals} × ${g.opponent_goals}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {gameTime.toLocaleString('pt-BR', {
                      weekday: 'short', day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda'
                    })}
                  </p>
                  {g.status === 'finished' && (
                    <p className="text-xs mt-0.5">
                      {(exactWinners[g.id] ?? []).length > 0
                        ? <span className="text-green-400">💯 {exactWinners[g.id].join(', ')}</span>
                        : <span className="text-gray-600">💯 Ninguém cravou</span>
                      }
                    </p>
                  )}
                </div>
                {closed ? (
                  <Link href={`/games/${g.id}/bets`} className="text-xs text-yellow-400 hover:underline whitespace-nowrap">
                    👀 Ver palpites
                  </Link>
                ) : (
                  <span className="text-xs text-gray-500 whitespace-nowrap">🔒 Em breve</span>
                )}
              </div>
            )
          })}
        </div>
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
                  {entry.breakdown.total > 0 && (
                    <p className="text-[11px] text-gray-600 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                      {entry.breakdown.result > 0 && <span>🏆 Resultado +{entry.breakdown.result}</span>}
                      {entry.breakdown.exact_bonus > 0 && <span>💯 Exato +{entry.breakdown.exact_bonus}</span>}
                      {entry.breakdown.brazil_goals > 0 && <span>🇧🇷 Gols +{entry.breakdown.brazil_goals}</span>}
                      {entry.breakdown.opp_goals > 0 && <span>🆚 Gols +{entry.breakdown.opp_goals}</span>}
                      {entry.breakdown.first_goal > 0 && <span>🥇 1º gol +{entry.breakdown.first_goal}</span>}
                      {entry.breakdown.var > 0 && <span>🚫 VAR +{entry.breakdown.var}</span>}
                      {entry.breakdown.penalty > 0 && <span>⚠️ Pênalti +{entry.breakdown.penalty}</span>}
                      {entry.breakdown.header > 0 && <span>🤕 Cabeçada +{entry.breakdown.header}</span>}
                      {entry.breakdown.yellow_cards > 0 && <span>🟨 Cartões +{entry.breakdown.yellow_cards}</span>}
                      {entry.breakdown.overtime > 0 && <span>⏱️ Prorroga +{entry.breakdown.overtime}</span>}
                      {entry.breakdown.penalty_shootout > 0 && <span>🥅 Pênaltis +{entry.breakdown.penalty_shootout}</span>}
                    </p>
                  )}
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
