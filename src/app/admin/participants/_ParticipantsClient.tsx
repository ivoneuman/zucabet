'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Participant } from '@/types'

export default function ParticipantsClient({ participants }: { participants: Participant[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !pin.trim()) { setError('Nome e PIN são obrigatórios.'); return }
    if (pin.length < 4) { setError('PIN deve ter pelo menos 4 dígitos.'); return }

    setLoading(true)
    const res = await fetch('/api/admin/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pin, is_admin: isAdmin }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Erro ao criar participante.'); return }

    setName(''); setPin(''); setIsAdmin(false)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {/* Formulário de adição */}
      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-gray-300">Adicionar participante</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
        />
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          placeholder="PIN (só números, mín. 4 dígitos)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
          maxLength={8}
        />
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="rounded"
          />
          É administrador
        </label>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Adicionando...' : '+ Adicionar'}
        </button>
      </form>

      {/* Lista */}
      <div className="space-y-2">
        {participants.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-6">Nenhum participante ainda.</p>
        )}
        {participants.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
            <div>
              <p className="font-medium text-white">{p.name}</p>
              <p className="text-xs text-gray-500">{p.is_admin ? '👑 Admin' : 'Participante'}</p>
            </div>
            <span className="text-xs text-gray-600">
              {new Date(p.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
