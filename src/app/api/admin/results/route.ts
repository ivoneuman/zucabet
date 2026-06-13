import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { calculateScore, getPotWinners } from '@/lib/scoring'
import type { Bet, Game } from '@/types'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const body = await request.json()
  const {
    game_id,
    brazil_goals,
    opponent_goals,
    first_goal_type,
    first_goal_player,
    var_annulled,
    penalty,
    header_goal,
    brazil_yellow_cards,
    bet_amount,
    accumulated,
  } = body

  if (game_id === undefined || brazil_goals === undefined || opponent_goals === undefined) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  // 1. Busca todos os palpites do jogo
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('*')
    .eq('game_id', game_id)

  if (betsError) return NextResponse.json({ error: betsError.message }, { status: 500 })

  // 2. Monta o objeto game com resultado para calcular pontos
  const gameResult: Partial<Game> = {
    id: game_id,
    brazil_goals,
    opponent_goals,
    first_goal_type,
    first_goal_player,
    var_annulled,
    penalty,
    header_goal,
    brazil_yellow_cards,
  }

  // 3. Calcula pontos de cada palpite
  const updates = (bets ?? []).map((bet: Bet) => {
    const breakdown = calculateScore(bet, gameResult as Game)
    return { id: bet.id, points: breakdown.total }
  })

  for (const u of updates) {
    await supabase.from('bets').update({ points: u.points }).eq('id', u.id)
  }

  // 4. Determina vencedores do pote
  const numParticipants = (bets ?? []).length
  const potThisRound = (bet_amount ?? 0) * numParticipants + (accumulated ?? 0)
  const winners = getPotWinners(bets ?? [], gameResult as Game)

  let potWinnerId: string | null = null
  let newAccumulated = accumulated ?? 0

  if (winners.length > 0) {
    // Divide igualmente (arredonda para baixo, o restante vai para o próximo)
    const share = Math.floor(potThisRound / winners.length)
    newAccumulated = potThisRound - share * winners.length // sobra de arredondamento
    potWinnerId = winners[0] // para referência; na prática split é manual
  } else {
    // Ninguém acertou: acumula
    newAccumulated = potThisRound
  }

  // 5. Atualiza o jogo com resultado e status 'finished'
  const { error: gameError } = await supabase
    .from('games')
    .update({
      brazil_goals,
      opponent_goals,
      first_goal_type,
      first_goal_player,
      var_annulled,
      penalty,
      header_goal,
      brazil_yellow_cards,
      status: 'finished',
      pot_winner_id: winners.length === 1 ? winners[0] : null,
    })
    .eq('id', game_id)

  if (gameError) return NextResponse.json({ error: gameError.message }, { status: 500 })

  // 6. Atualiza o pote global
  await supabase
    .from('pot_state')
    .update({ accumulated: newAccumulated, updated_at: new Date().toISOString() })
    .eq('id', 1)

  return NextResponse.json({
    ok: true,
    winners,
    pot_this_round: potThisRound,
    new_accumulated: newAccumulated,
    bets_scored: updates.length,
  })
}
