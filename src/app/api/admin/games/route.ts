import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const { opponent, game_date, phase } = await request.json()

  if (!opponent || !game_date) {
    return NextResponse.json({ error: 'Adversário e data são obrigatórios.' }, { status: 400 })
  }

  const { error } = await supabase.from('games').insert({
    opponent: opponent.trim(),
    game_date,
    phase: phase ?? 'group',
    status: 'upcoming',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 })

  const { error } = await supabase.from('games').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
