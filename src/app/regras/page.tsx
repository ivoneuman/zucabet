import { getSession } from '@/lib/auth'
import Link from 'next/link'

export default async function RegrasPage() {
  const session = await getSession()
  const betAmount = parseInt(process.env.NEXT_PUBLIC_BET_AMOUNT ?? '10000')

  return (
    <div className="min-h-screen max-w-lg mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between pt-2">
        <Link href="/ranking" className="text-gray-400 hover:text-white text-sm transition-colors">← Ranking</Link>
        {session && <p className="text-xs text-gray-500">Olá, {session.name}</p>}
      </header>

      <div>
        <h1 className="text-2xl font-black text-yellow-400">📜 Regras do Bolão</h1>
        <p className="text-gray-400 text-sm mt-1">ZUCA BET 🇧🇷 — só os jogos do Brasil</p>
      </div>

      {/* Como funciona */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
        <h2 className="font-bold text-white">⏰ Como funciona</h2>
        <p className="text-sm text-gray-400">
          Cada participante faz seu palpite para cada jogo do Brasil até <strong className="text-white">5 minutos antes</strong> do
          horário da bola rolar. Depois disso, os palpites ficam bloqueados (e só aparecem para todo
          mundo ver depois que o prazo encerra).
        </p>
        <p className="text-sm text-gray-400">
          Dá pra editar seu palpite quantas vezes quiser, contanto que ainda esteja dentro do prazo.
        </p>
      </section>

      {/* Aposta */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
        <h2 className="font-bold text-white">💵 Valor da aposta</h2>
        <p className="text-sm text-gray-400">
          Cada participante contribui com <strong className="text-yellow-400">Kz {betAmount.toLocaleString('pt-BR')}</strong> por
          jogo. O total forma o "pote" daquela rodada.
        </p>
      </section>

      {/* Pontuação */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <h2 className="font-bold text-white">🏆 Pontuação (máximo 15 pts por jogo)</h2>
        <p className="text-sm text-gray-400">Para cada jogo, você ganha pontos por cada item que acertar no seu palpite:</p>
        <ul className="text-sm text-gray-300 space-y-1.5">
          <li className="flex justify-between"><span>🏆 Resultado (vitória / empate / derrota)</span><span className="text-yellow-400 font-semibold">3 pts</span></li>
          <li className="flex justify-between"><span>🇧🇷 Gols do Brasil (exato)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
          <li className="flex justify-between"><span>🆚 Gols do adversário (exato)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
          <li className="flex justify-between"><span>💯 Placar exato (bônus extra)</span><span className="text-yellow-400 font-semibold">+5 pts</span></li>
          <li className="flex justify-between"><span>🥇 Primeiro gol do Brasil (tipo e/ou jogador)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
          <li className="flex justify-between"><span>🚫 Gol anulado pelo VAR (sim/não)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
          <li className="flex justify-between"><span>⚠️ Pênalti no jogo (sim/não)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
          <li className="flex justify-between"><span>🤕 Gol de cabeça (sim/não)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
          <li className="flex justify-between"><span>🟨 Cartões amarelos do Brasil (exato)</span><span className="text-yellow-400 font-semibold">1 pt</span></li>
        </ul>
        <p className="text-xs text-gray-500">
          Acertar o placar exato vale tanto o ponto de gols do Brasil quanto o de gols do adversário, mais o bônus de +5 — ou seja, 7 pts só do placar.
        </p>
      </section>

      {/* Pote */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
        <h2 className="font-bold text-white">💰 O pote</h2>
        <ul className="text-sm text-gray-400 space-y-2 list-disc pl-4">
          <li>Quem acertar o <strong className="text-white">placar exato</strong> daquele jogo leva o pote da rodada.</li>
          <li>Se mais de uma pessoa acertar, o pote é dividido igualmente entre elas.</li>
          <li>Se ninguém acertar o placar exato, o pote <strong className="text-white">acumula</strong> para a próxima rodada.</li>
          <li>No último jogo, se ainda houver pote acumulado e ninguém acertar o placar exato, quem estiver em <strong className="text-white">1º lugar no ranking geral</strong> leva o pote.</li>
          <li>Se no final não houver pote acumulado e ninguém para receber, o 1º lugar geral ganha uma <strong className="text-white">caixa de cerveja 🍺</strong> (ou equivalente, a combinar).</li>
        </ul>
      </section>

      <p className="text-xs text-gray-600 text-center pb-2">
        Em caso de dúvida sobre as regras, fala com o admin do bolão. Boa sorte! ⚽🇧🇷
      </p>
    </div>
  )
}
