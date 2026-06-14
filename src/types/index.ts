export type GameStatus = 'upcoming' | 'open' | 'finished'
export type FirstGoalType = 'player' | 'own_goal' | 'no_goal'
export type GamePhase = 'group' | 'round_of_32' | 'round_of_16' | 'quarter' | 'semi' | 'final'

export interface Participant {
  id: string
  name: string
  is_admin: boolean
  created_at: string
}

export interface Game {
  id: string
  phase: GamePhase
  opponent: string
  game_date: string
  status: GameStatus
  brazil_goals: number | null
  opponent_goals: number | null
  first_goal_type: FirstGoalType | null
  first_goal_player: string | null
  var_annulled: boolean | null
  penalty: boolean | null
  header_goal: boolean | null
  brazil_yellow_cards: number | null
  pot_carried_in: number
  pot_winner_id: string | null
  created_at: string
}

export interface Bet {
  id: string
  participant_id: string
  game_id: string
  brazil_goals: number
  opponent_goals: number
  first_goal_type: FirstGoalType
  first_goal_player: string | null
  var_annulled: boolean
  penalty: boolean
  header_goal: boolean
  brazil_yellow_cards: number
  points: number | null
  created_at: string
}

export interface PotState {
  id: number
  accumulated: number
  updated_at: string
}

export interface SessionPayload {
  id: string
  name: string
  is_admin: boolean
}

// Pontuação detalhada de um palpite
export interface ScoreBreakdown {
  result: number        // 3 se acertou vitória/empate/derrota
  brazil_goals: number  // 1 se acertou gols do Brasil
  opp_goals: number     // 1 se acertou gols do adversário
  exact_bonus: number   // 5 se placar exato
  first_goal: number    // 1 se acertou primeiro gol
  var: number           // 1 se acertou VAR
  penalty: number       // 1 se acertou pênalti
  header: number        // 1 se acertou cabeçada
  yellow_cards: number  // 1 se acertou cartões amarelos
  total: number
}

export interface RankingEntry {
  participant: Participant
  total_points: number
  bets_count: number
  exact_scores: number
  breakdown: ScoreBreakdown
}
