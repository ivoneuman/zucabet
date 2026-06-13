import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import BetForm from './_BetForm'
import type { Bet, Game } from '@/types'

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

export default async function BetPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const game = await getNextGame()

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-300 font-semibold">Nenhum jogo disponível no momento.</p>
          <a href="/ranking" className="text-yellow-400 text-sm mt-3 inline-block hover:underline">← Voltar ao ranking</a>
        </div>
      </div>
    )
  }

  const now = new Date()
  const gameTime = new Date(game.game_date)
  const minutesUntil = (gameTime.getTime() - now.getTime()) / 60000

  if (game.status === 'open' || minutesUntil <= 5) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-300 font-semibold">Palpites encerrados!</p>
          <p className="text-gray-500 text-sm mt-1">Os palpites fecham 5 minutos antes do jogo.</p>
          <a href="/ranking" className="text-yellow-400 text-sm mt-3 inline-block hover:underline">← Ver ranking</a>
        </div>
      </div>
    )
  }

  // Busca palpite existente do participante
  const { data: existingBet } = await supabase
    .from('bets')
    .select('*')
    .eq('participant_id', session.id)
    .eq('game_id', game.id)
    .single()

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4">
      <header className="flex items-center justify-between pt-2 mb-6">
        <a href="/ranking" className="text-gray-400 hover:text-white text-sm transition-colors">← Ranking</a>
        <p className="text-xs text-gray-500">Olá, {session.name}</p>
      </header>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-yellow-400">Seu Palpite</h1>
        <p className="text-gray-400 mt-1">
          Brasil vs {game.opponent} ·{' '}
          {new Date(game.game_date).toLocaleString('pt-BR', {
            weekday: 'long', day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda'
          })}
        </p>
        <p className="text-xs text-amber-400 mt-1">
          Fecha em: {Math.floor(minutesUntil)} min
        </p>
      </div>

      <BetForm
        game={game}
        participantId={session.id}
        existingBet={existingBet as Bet | null}
      />
    </div>
  )
}
