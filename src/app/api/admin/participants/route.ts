import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.is_admin) return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 })

  const { name, pin, is_admin } = await request.json()

  if (!name || !pin) return NextResponse.json({ error: 'Nome e PIN são obrigatórios.' }, { status: 400 })
  if (String(pin).length < 4) return NextResponse.json({ error: 'PIN deve ter pelo menos 4 dígitos.' }, { status: 400 })

  const pin_hash = await bcrypt.hash(String(pin), 10)

  const { error } = await supabase.from('participants').insert({ name: name.trim(), pin_hash, is_admin: !!is_admin })

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Já existe um participante com este nome.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
