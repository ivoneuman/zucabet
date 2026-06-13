import { supabase } from '@/lib/supabase'
import ResultsClient from './_ResultsClient'
import type { Game, Bet, Participant } from '@/types'

export default async function ResultsPage() {
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: true })

  const { data: potState } = await supabase.from('pot_state').select('accumulated').single()

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
      />
    </div>
  )
}
