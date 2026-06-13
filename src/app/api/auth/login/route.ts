import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { createSession, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: Request) {
  const { name, pin } = await request.json()

  if (!name || !pin) {
    return NextResponse.json({ error: 'Nome e PIN são obrigatórios.' }, { status: 400 })
  }

  const { data: participant, error } = await supabase
    .from('participants')
    .select('id, name, pin_hash, is_admin')
    .eq('name', name.trim())
    .single()

  if (error || !participant) {
    return NextResponse.json({ error: 'Participante não encontrado.' }, { status: 401 })
  }

  const valid = await bcrypt.compare(String(pin), participant.pin_hash)
  if (!valid) {
    return NextResponse.json({ error: 'PIN incorreto.' }, { status: 401 })
  }

  const token = await createSession({
    id: participant.id,
    name: participant.name,
    is_admin: participant.is_admin,
  })

  const response = NextResponse.json({ ok: true, is_admin: participant.is_admin })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })

  return response
}
