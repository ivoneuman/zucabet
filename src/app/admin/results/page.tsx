import { supabase } from '@/lib/supabase'
import ResultsClient from './_ResultsClient'
import type { Game } from '@/types'

export default async function ResultsPage() {
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: true })

  const { data: potState } = await supabase.from('pot_state').select('accumulated').single()

  // Para cada jogo finalizado, descobrir quem cravou o placar exato
  const finishedGames = (games ?? []).filter((g) => g.status === 'finished') as Game[]
  const exactWinners: Record<string, string[]> = {}

  if (finishedGames.length > 0) {
    const finishedIds = finishedGames.map((g) => g.id)
    const { data: bets } = await supabase
      .from('bets')
      .select('game_id, brazil_goals, opponent_goals, participants(name)')
      .in('game_id', finishedIds)

    for (const game of finishedGames) {
      const winners = (bets ?? [])
        .filter(
          (b: any) =>
            b.game_id === game.id &&
            b.brazil_goals === game.brazil_goals &&
            b.opponent_goals === game.opponent_goals
        )
        .map((b: any) => b.participants?.name ?? '?')
      exactWinners[game.id] = winners
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-200">Lançar Resultado</h2>
      <p className="text-xs text-gray-500">
        Pote acumulado atual: <span className="text-yellow-400 font-bold">Kz {(potState?.accumulated ?? 0).toLocaleString('pt-BR')}</span>
      </p>
      <ResultsClient
        games={(games ?? []) as Game[]}
        betAmount={parseInt(process.env.NEXT_PUBLIC_BET_AMOUNT ?? '10000')}
        accumulated={potState?.accumulated ?? 0}
        exactWinners={exactWinners}
      />
    </div>
  )
}
