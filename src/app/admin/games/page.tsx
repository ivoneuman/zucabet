import { supabase } from '@/lib/supabase'
import GamesClient from './_GamesClient'
import type { Game } from '@/types'

export default async function GamesPage() {
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: true })

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-200">Jogos</h2>
      <GamesClient games={(games ?? []) as Game[]} />
    </div>
  )
}
