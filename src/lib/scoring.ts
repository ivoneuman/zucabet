import type { Bet, Game, ScoreBreakdown } from '@/types'

function gameResult(brazil: number, opp: number): 'win' | 'draw' | 'loss' {
  if (brazil > opp) return 'win'
  if (brazil === opp) return 'draw'
  return 'loss'
}

export function calculateScore(bet: Bet, game: Game): ScoreBreakdown {
  // Jogo precisa ter resultado lançado
  if (
    game.brazil_goals === null ||
    game.opponent_goals === null ||
    game.first_goal_type === null ||
    game.var_annulled === null ||
    game.penalty === null ||
    game.header_goal === null ||
    game.brazil_yellow_cards === null
  ) {
    return { result: 0, brazil_goals: 0, opp_goals: 0, exact_bonus: 0, first_goal: 0, var: 0, penalty: 0, header: 0, yellow_cards: 0, total: 0 }
  }

  const breakdown: ScoreBreakdown = {
    result: 0,
    brazil_goals: 0,
    opp_goals: 0,
    exact_bonus: 0,
    first_goal: 0,
    var: 0,
    penalty: 0,
    header: 0,
    yellow_cards: 0,
    total: 0,
  }

  // Resultado correto (vitória / empate / derrota)
  if (gameResult(bet.brazil_goals, bet.opponent_goals) === gameResult(game.brazil_goals, game.opponent_goals)) {
    breakdown.result = 3
  }

  // Gols do Brasil correto
  if (bet.brazil_goals === game.brazil_goals) {
    breakdown.brazil_goals = 1
  }

  // Gols do adversário correto
  if (bet.opponent_goals === game.opponent_goals) {
    breakdown.opp_goals = 1
  }

  // Placar exato: bônus de +5
  if (bet.brazil_goals === game.brazil_goals && bet.opponent_goals === game.opponent_goals) {
    breakdown.exact_bonus = 5
  }

  // Primeiro gol do Brasil
  if (bet.first_goal_type === game.first_goal_type) {
    // Se o tipo é 'player', verifica se o jogador também bate
    if (bet.first_goal_type === 'player') {
      if (
        bet.first_goal_player &&
        game.first_goal_player &&
        bet.first_goal_player.trim().toLowerCase() === game.first_goal_player.trim().toLowerCase()
      ) {
        breakdown.first_goal = 1
      }
    } else {
      // 'own_goal' ou 'no_goal' — só o tipo já vale
      breakdown.first_goal = 1
    }
  }

  // VAR
  if (bet.var_annulled === game.var_annulled) {
    breakdown.var = 1
  }

  // Pênalti
  if (bet.penalty === game.penalty) {
    breakdown.penalty = 1
  }

  // Gol de cabeça
  if (bet.header_goal === game.header_goal) {
    breakdown.header = 1
  }

  // Cartões amarelos do Brasil
  if (bet.brazil_yellow_cards === game.brazil_yellow_cards) {
    breakdown.yellow_cards = 1
  }

  breakdown.total =
    breakdown.result +
    breakdown.brazil_goals +
    breakdown.opp_goals +
    breakdown.exact_bonus +
    breakdown.first_goal +
    breakdown.var +
    breakdown.penalty +
    breakdown.header +
    breakdown.yellow_cards

  return breakdown
}

export function isExactScore(bet: Bet, game: Game): boolean {
  return (
    game.brazil_goals !== null &&
    game.opponent_goals !== null &&
    bet.brazil_goals === game.brazil_goals &&
    bet.opponent_goals === game.opponent_goals
  )
}

/**
 * Retorna o(s) vencedor(es) do pote da rodada (quem acertou o placar exato).
 * Se nenhum acertou, retorna array vazio (pote acumula).
 */
export function getPotWinners(bets: Bet[], game: Game): string[] {
  return bets
    .filter((b) => isExactScore(b, game))
    .map((b) => b.participant_id)
}
