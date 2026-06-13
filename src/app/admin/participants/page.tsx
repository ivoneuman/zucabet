import { supabase } from '@/lib/supabase'
import ParticipantsClient from './_ParticipantsClient'
import type { Participant } from '@/types'

export default async function ParticipantsPage() {
  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, is_admin, created_at')
    .order('name')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-200">Participantes</h2>
      <ParticipantsClient participants={(participants ?? []) as Participant[]} />
    </div>
  )
}
