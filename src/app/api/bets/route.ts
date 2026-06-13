import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// Verifica se os palpites ainda estão abertos (> 5 min antes do jogo)
async function isBettingOpen(gameId: string): Promise<boolean> {
  const { data: game } = await supabase
    .from('games')
    .select('game_date, status')
    .eq('id', gameId)
    .single()

  if (!game) return false
  if (game.status !== 'upcoming') return false

  const now = new Date()
  const gameTime = new Date(game.game_date)
  return gameTime.getTime() - now.getTime() > 5 * 60 * 1000
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { game_id, brazil_goals, opponent_goals, first_goal_type, first_goal_player, var_annulled, penalty, header_goal, brazil_yellow_cards } = body

  if (!game_id) return NextResponse.json({ error: 'game_id obrigatório.' }, { status: 400 })

  if (!(await isBettingOpen(game_id))) {
    return NextResponse.json({ error: 'Palpites encerrados para este jogo.' }, { status: 403 })
  }

  const { error } = await supabase.from('bets').insert({
    participant_id: session.id,
    game_id,
    brazil_goals,
    opponent_goals,
    first_goal_type,
    first_goal_player,
    var_annulled,
    penalty,
    header_goal,
    brazil_yellow_cards,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Você já fez um palpite para este jogo. Use PUT para atualizar.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const { game_id, brazil_goals, opponent_goals, first_goal_type, first_goal_player, var_annulled, penalty, header_goal, brazil_yellow_cards } = body

  if (!(await isBettingOpen(game_id))) {
    return NextResponse.json({ error: 'Palpites encerrados para este jogo.' }, { status: 403 })
  }

  const { error } = await supabase
    .from('bets')
    .update({ brazil_goals, opponent_goals, first_goal_type, first_goal_player, var_annulled, penalty, header_goal, brazil_yellow_cards })
    .eq('participant_id', session.id)
    .eq('game_id', game_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
