import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZUCA BET',
  description: 'Bolão da Copa 2026 — só os jogos do Brasil',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-white min-h-screen">{children}</body>
    </html>
  )
}
