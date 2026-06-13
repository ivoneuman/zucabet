# Caderno — ZUCA BET

## Decisões de arquitetura

- **Stack**: Next.js 14 (App Router) + Supabase + Vercel
- **Auth**: JWT em cookie httpOnly (não Supabase Auth) — login por nome + PIN (bcrypt)
- **Fuso horário**: Africa/Luanda (UTC+1) nas exibições de data
- **Palpites**: bloqueio server-side na API 5 min antes do horário do jogo
- **Visibilidade**: palpites ficam ocultos enquanto jogo status = 'upcoming'/'open'; exibidos após 'finished'
- **Pote**: singleton na tabela `pot_state`, atualizado atomicamente ao lançar resultado

## Regras do pote

- Jogo encerrado sem acertadores → pote acumula
- Múltiplos acertadores → divisão igualitária (Math.floor); centavos acumulam para próxima rodada
- Último jogo com pote acumulado → líder do ranking geral leva
- Sem pote acumulado no fim → líder ganha caixa de cerveja 🍺

## Valor da aposta

Configurado via `NEXT_PUBLIC_BET_AMOUNT` (default: 10000 Kwanzas)

## Pontuação máxima por jogo: 15 pts

Resultado(3) + gols Brasil(1) + gols adversário(1) + bônus exato(5) + 1º gol(1) + VAR(1) + pênalti(1) + cabeçada(1) + cartões(1)

## Pendente / Fase 2

- Mensagens engraçadinhas
- Badges no ranking
- Histórico por rodada
- Compartilhamento WhatsApp
- Estados de humor dos palpites

## Deploy — progresso

- Projeto Supabase criado: org "Zucabet", ref `vegfioywhpbwomufdlxn`, região São Paulo
- Schema aplicado com sucesso via SQL Editor
- `.env.local` configurado:
  - `NEXT_PUBLIC_SUPABASE_URL=https://vegfioywhpbwomufdlxn.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave "publishable" (`sb_publishable_...`, formato novo do Supabase — funciona com `@supabase/supabase-js` normalmente, RLS é permissivo)
  - `SESSION_SECRET` gerado via `openssl rand -base64 32`
  - `NEXT_PUBLIC_BET_AMOUNT=10000`
- Próximo: criar admin (Ivo) na tabela `participants` com hash bcrypt do PIN

## Arquivos principais

- `supabase/schema.sql` — executar no SQL Editor do Supabase
- `.env.local.example` → copiar para `.env.local`
- `src/lib/scoring.ts` — lógica de pontuação
- `src/app/api/admin/results/route.ts` — cálculo de pote e pontos
