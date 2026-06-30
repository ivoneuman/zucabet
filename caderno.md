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

## Pontuação máxima por jogo: 17 pts (atualizado em 30/06/2026)

Resultado(3) + gols Brasil(1) + gols adversário(1) + bônus exato(5) + 1º gol(1) + VAR(1) + pênalti(1) + cabeçada(1) + cartões(1) + prorrogação(1) + pênaltis(1)

## Pendente / Fase 2

- **Dropdown de jogadores no palpite**: substituir campo de texto livre do "1º gol do Brasil" por `<select>` com elenco canônico → elimina variações de digitação na origem
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
- Admin criado: "Luiz" (PIN 2021), `is_admin = true`
- Código no GitHub: https://github.com/ivoneuman/zucabet (repo público, main, commit `ade8fb3`)
  - Autenticação feita via OAuth device flow (GitHub CLI) com consentimento do usuário
  - `.env.local` corretamente excluído via `.gitignore`
- Deploy concluído na Vercel: https://zucabet.vercel.app
  - Projeto importado do GitHub (ivoneuman/zucabet, branch main)
  - 4 env vars configuradas (Production and Preview): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SESSION_SECRET, NEXT_PUBLIC_BET_AMOUNT
  - Build com 1 warning (não bloqueante), deploy concluído com sucesso
  - Login testado em produção com admin "Luiz" (PIN 2021) — funcionando, painel admin carregou normalmente
- MVP Fase 1 está completo e em produção. Próximo: cadastrar participantes e os 3 jogos da fase de grupos via painel admin

## Arquivos principais

- `supabase/schema.sql` — executar no SQL Editor do Supabase
- `.env.local.example` → copiar para `.env.local`
- `src/lib/scoring.ts` — lógica de pontuação
- `src/app/api/admin/results/route.ts` — cálculo de pote e pontos

## Sessão 13/06/2026 — correção dos jogos do Brasil + ajustes admin

### O que mudou
- **Jogos corrigidos** (Grupo C real da Copa 2026): Brasil × Marrocos (13/06 19h Brasília), Brasil × Haiti (19/06 21h30 Brasília), Brasil × Escócia (24/06 19h Brasília). Os 3 jogos antigos incorretos (México/Japão/Camarões, datas erradas) foram removidos via painel admin.
- **Excluir jogo**: novo botão 🗑️ em cada jogo no admin, com endpoint `DELETE /api/admin/games` (remove o jogo e palpites associados via cascade).
- **Nova fase**: "16-avos de final" (`round_of_32`) adicionada ao tipo `GamePhase` e ao dropdown "Adicionar jogo".
- **Bandeira do Brasil no header admin**: o emoji 🇧🇷 aparecia como texto "BR" no Windows (problema de fonte). Trocado por SVG inline (retângulo verde, losango amarelo, círculo azul).

### Arquivos alterados
- `src/types/index.ts` — adiciona `'round_of_32'` ao union `GamePhase`
- `src/app/admin/games/_GamesClient.tsx` — `PHASE_LABELS`, `DEFAULT_GAMES` (jogos corretos), `handleDelete`, botão 🗑️
- `src/app/api/admin/games/route.ts` — adiciona handler `DELETE`
- `src/app/admin/layout.tsx` — substitui emoji 🇧🇷 por SVG inline

### Como foi publicado (workaround)
`git push` via GitHub OAuth (device flow) continuou falhando nesta sessão (CLI não autenticado / sandbox isolado). Editor web do GitHub (CodeMirror) também travou ao colar via clipboard. Workaround que funcionou: usar a página de **upload do GitHub** (`https://github.com/ivoneuman/zucabet/upload/main/<pasta>`), enviar o arquivo local (mesmo nome) via upload — o GitHub detecta como substituição — e commitar direto na `main`. Vercel faz redeploy automático. Repetido com sucesso para os 4 arquivos acima (5 commits no total).

### Rollback
- Reverter cada arquivo para a versão anterior via o mesmo processo de upload, ou `git revert` dos commits ("Adiciona fase round_of_32...", "Atualiza jogos (Grupo C real)...", "Adiciona endpoint DELETE...", "Troca emoji da bandeira...") quando houver acesso `git push` funcional.
- Os 3 jogos corretos (Marrocos/Haiti/Escócia) foram cadastrados via botão "⚡ Pré-carregar 3 jogos da fase de grupos" no admin — se precisar desfazer, basta excluir via 🗑️ e recadastrar manualmente.

### Verificado em produção (https://zucabet.vercel.app)
- Header mostra bandeira SVG corretamente (não mais "BR")
- Jogos: Brasil × Marrocos, Brasil × Haiti, Brasil × Escócia (datas corretas)
- Dropdown "Adicionar jogo" inclui "16-avos de final"

## Sessão 14/06/2026 — 5 ajustes pós-lançamento (sem alterar regras)

Pedido do usuário: 5 melhorias de UI/UX na produção, **sem alterar regras de pontuação/pote nem prejudicar a disputa em andamento**.

### O que mudou

1. **"Ver palpites"**: nova página `/games/[id]/bets` mostra os palpites de todos os participantes para um jogo, liberada quando o prazo de aposta encerra (`status === 'finished'` ou `minutesUntil <= 5`). Antes do prazo, mostra tela "🤫 Palpites ainda não revelados". No ranking, cada jogo na nova seção "Jogos" tem link "👀 Ver palpites" (se liberado) ou "🔒 Em breve".
2. **"Palpitar" → "Editar palpite"**: o CTA "Próximo jogo" no ranking agora verifica se o participante já tem palpite para aquele jogo; se sim, mostra "Editar palpite" (mesma regra de prazo de 5 min antes do jogo), senão "Palpitar". Se o prazo já passou e não há palpite, mostra "Ver palpites" no lugar.
3. **Detalhamento de pontuação no ranking**: `RankingEntry` agora inclui `breakdown: ScoreBreakdown` (calculado via `calculateScore` de `scoring.ts`). Cada participante no ranking mostra pills com os componentes que acertou (🏆 resultado, 💯 placar exato, 🇧🇷 gols Brasil, 🆚 gols adversário, 🥇 1º gol, 🚫 VAR, ⚠️ pênalti, 🤕 cabeçada, 🟨 cartões).
4. **Admin Dashboard**: removido o bloco de texto "Fluxo rápido" (conteúdo solto, não usado).
5. **Admin Resultados — jogos finalizados**: cada jogo finalizado agora mostra detalhes (1º gol, VAR, pênalti, cabeçada, cartões) e um botão "✏️ Editar" que abre um formulário pré-preenchido. Ao salvar:
   - Atualiza os campos do resultado do jogo (placar, 1º gol, VAR, pênalti, cabeçada, cartões).
   - **Recalcula os pontos de cada palpite** (via `calculateScore`) e atualiza `bets.points` e o ranking.
   - **NÃO toca em `pot_state.accumulated` nem em `pot_winner_id`** — decisão aprovada pelo usuário (opção "Recalcula pontos, não toca no pote") para não perturbar o pote já distribuído/acumulado da rodada anterior.
   - Se a correção mudaria quem teria acertado o placar exato (e portanto quem ganharia o pote daquele jogo), a API retorna um `pot_warning` exibido como alerta — apenas informativo, não recalcula o pote automaticamente.

### Arquivos alterados/criados
- `src/types/index.ts` — `breakdown: ScoreBreakdown` em `RankingEntry`
- `src/app/admin/page.tsx` — remove bloco "Fluxo rápido"
- `src/app/ranking/page.tsx` — `getRanking()` com breakdown, `getAllGames()`, `getMyBet()`, CTA dinâmico (Palpitar/Editar palpite/Ver palpites), nova seção "Jogos", pills de pontuação
- `src/app/games/[id]/bets/page.tsx` — **novo arquivo**, página "Ver palpites"
- `src/app/api/admin/results/route.ts` — branch de edição (`isEdit`) quando `currentGame.status === 'finished'`: recalcula pontos das apostas, atualiza campos do jogo, retorna `pot_warning`; pote/status/pot_winner_id só são tocados em lançamentos novos (`!isEdit`)
- `src/app/admin/results/_ResultsClient.tsx` — cards de finalizados com detalhes + botão "✏️ Editar"/"Cancelar", `ResultForm` com modo edição (prefill, mensagem de confirmação diferente, alerta de `pot_warning`)

### Como foi publicado
Mesmo workaround de upload via GitHub web (`git push` continua indisponível no sandbox): 6 arquivos enviados via `https://github.com/ivoneuman/zucabet/upload/main/<pasta>` (pasta `[id]` codificada como `%5Bid%5D`), um commit por arquivo, Vercel redeploy automático.

### Rollback
- Reverter cada um dos 6 arquivos para a versão anterior via novo upload, ou `git revert` dos 6 commits desta sessão quando houver `git push` funcional:
  - "Adiciona breakdown ao RankingEntry (item 3)"
  - "Admin: remove bloco Fluxo rapido (item 4)"
  - "Ranking: ver palpites, editar palpite, breakdown de pontuacao (itens 1-3)"
  - "Nova pagina: ver palpites de um jogo (item 1)"
  - "API resultados: permite editar jogo finalizado (item 5)"
  - "Admin Resultados: detalhes e edicao de jogos finalizados (item 5)"
- Reverter `_ResultsClient.tsx` e `route.ts` (últimos 2) é suficiente para desativar a edição de jogos finalizados sem afetar os itens 1-4.

### Verificado em produção (https://zucabet.vercel.app)
- Item 1: seção "Jogos" no ranking; Marrocos (finalizado) mostra "👀 Ver palpites" → lista de todos os participantes com seus palpites detalhados e pontos; Haiti/Escócia (futuros) mostram "🔒 Em breve"
- Item 2: CTA "Próximo jogo" (Haiti) mostra "Palpitar" para Luiz, que ainda não tem palpite
- Item 3: ranking mostra pills de pontuação (ex.: Bruna "🇧🇷 Gols +1, 🥇 1º gol +1, 🤕 Cabeçada +1, 🟨 Cartões +1" = 4 pts)
- Item 4: bloco "Fluxo rápido" não aparece mais no `/admin`
- Item 5: card "Brasil 1 × 1 Marrocos" mostra detalhes (1º gol Vini Jr, VAR Não, Pênalti Não, Cabeçada Não, Cartões BR: 2) e botão "✏️ Editar" abre formulário pré-preenchido corretamente; **teste no-op** (reenviar os mesmos valores) executado com sucesso — pontos de Bruna continuaram 4 pts e pote continuou Kz 60.000, confirmando que a edição não alterou dados sem necessidade

## Sessão 14/06/2026 — página de Regras do Bolão

### O que mudou
- Nova página `/regras` com as regras completas do bolão: como funciona (prazo de 5 min antes do jogo, edição de palpite, visibilidade), valor da aposta (Kz 10.000, via `NEXT_PUBLIC_BET_AMOUNT`), tabela de pontuação (máx. 15 pts: resultado 3, gols Brasil 1, gols adversário 1, placar exato +5, 1º gol 1, VAR 1, pênalti 1, cabeçada 1, cartões 1) e regras do pote (acumula, divisão igualitária, líder leva no final ou caixa de cerveja 🍺).
- Link "📜 Regras" adicionado no header da página de ranking (ao lado de Admin/Sair).

### Arquivos alterados/criados
- `src/app/regras/page.tsx` — **novo arquivo**, página de regras (estilo consistente: gray-900/gray-800, yellow-400)
- `src/app/ranking/page.tsx` — adiciona link `<Link href="/regras">📜 Regras</Link>` no header (1 linha)

### Como foi publicado
GitHub web upload (`https://github.com/ivoneuman/zucabet/upload/main/<pasta>`), 2 commits:
- "Nova pagina de regras do bolao"
- "Ranking: adiciona link para pagina de regras"
Vercel redeploy automático.

### Rollback
- Reverter `src/app/ranking/page.tsx` para a versão anterior (remove o link "📜 Regras") via novo upload ou `git revert`.
- Excluir/reverter `src/app/regras/page.tsx` se quiser remover a página inteira (não afeta nenhuma outra parte do app — página isolada, sem lógica de pontuação/pote).

### Verificado em produção (https://zucabet.vercel.app)
- `/regras` carrega corretamente com todas as seções (Como funciona, Valor da aposta, Pontuação, O pote)
- `/ranking` mostra o botão "📜 Regras" no header, ao lado de "Admin" e "Sair"

## Sessão 30/06/2026 — overtime, penalty_shootout e vencedores no ranking

### O que mudou
- **Novos campos de pontuação**: `overtime` (prorrogação, S/N, 1 pt) e `penalty_shootout` (disputa de pênaltis, S/N, 1 pt). Máximo de pontos por jogo sobe de 15 → **17 pts**.
- **SQL migration executada com sucesso** em 30/06/2026 no Supabase SQL Editor:
  ```sql
  ALTER TABLE games ADD COLUMN IF NOT EXISTS overtime BOOLEAN DEFAULT FALSE, ADD COLUMN IF NOT EXISTS penalty_shootout BOOLEAN DEFAULT FALSE;
  ALTER TABLE bets ADD COLUMN IF NOT EXISTS overtime BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN IF NOT EXISTS penalty_shootout BOOLEAN NOT NULL DEFAULT FALSE;
  ```
- **Vencedores do placar exato no ranking**: a seção "Jogos" agora mostra quem cravou o placar de cada jogo finalizado (💯 Nome1, Nome2) ou "💯 Ninguém cravou".

### Arquivos alterados
- `src/types/index.ts` — overtime/penalty_shootout em Game, Bet e ScoreBreakdown
- `src/lib/scoring.ts` — lógica de pontuação para overtime e penalty_shootout
- `src/app/bet/_BetForm.tsx` — campos Sim/Não para prorrogação e pênaltis no formulário
- `src/app/api/bets/route.ts` — salva overtime e penalty_shootout nas apostas
- `src/app/api/admin/results/route.ts` — lança overtime e penalty_shootout no resultado
- `src/app/admin/results/_ResultsClient.tsx` — campos no formulário de lançamento
- `src/app/admin/results/page.tsx` — passa exactWinners ao cliente
- `src/app/ranking/page.tsx` — vencedores por jogo + pills overtime/penalty_shootout
- `src/app/regras/page.tsx` — máx 17 pts, dois novos itens na tabela
- `src/app/games/[id]/bets/page.tsx` — exibe prorrogação e pênaltis nos palpites

### Causa raiz do build quebrado (todos os deploys falhando em 8-9s)
O `scoring.ts` commitado na sessão anterior tinha conteúdo antigo (sem overtime/penalty_shootout). Como `ScoreBreakdown` exige esses campos no objeto de retorno, o TypeScript falhava na compilação. Corrigido via CM6 (GitHub web editor).

### Como foi publicado
Deploy via GitHub web editor (CM6) — ver fluxo no CLAUDE.md. Commits confirmados, builds todos "Ready" na Vercel.

### Verificado em produção
Build ready em ~27s. SQL migration executada com sucesso em 30/06/2026.

## Sessão 14/06/2026 — correção: 1º gol não pontuava por variação no nome do jogador

### O problema
Caique apostou "Vinicius jr." como 1º gol do Brasil no jogo Brasil × Marrocos (resultado real: "Vini Jr"). A comparação antiga era exata (trim + lowercase), então "vinicius jr." ≠ "vini jr" e o ponto de 🥇 1º gol não era dado (Caique ficava com 4 pts em vez de 5). Bruna e Luiz, que digitaram exatamente "Vini Jr", receberam o ponto normalmente.

### O que mudou
- `src/lib/scoring.ts`: nova função `normalizePlayerName()` que remove acentos, pontuação (`.` e `-`) e espaços extras, e mapeia apelidos conhecidos do Vini Jr ("vinicius jr", "vinicius junior", "vini junior", "vinicius" → "vini jr") para o nome canônico "vini jr". A comparação do 1º gol em `calculateScore()` agora usa `normalizePlayerName(bet.first_goal_player) === normalizePlayerName(game.first_goal_player)` em vez de comparação exata.
- Recalculado o jogo Brasil 1×1 Marrocos via admin "✏️ Editar" → "💾 Salvar correção e recalcular pontos" (no-op resave, sem alterar nenhum valor) para aplicar a nova lógica retroativamente. Pote (Kz 60.000) e `pot_winner_id` não foram tocados (conforme regra existente do `isEdit`), sem `pot_warning`.

### Arquivo alterado
- `src/lib/scoring.ts`

### Como foi publicado
GitHub web upload (`https://github.com/ivoneuman/zucabet/upload/main/src/lib`), commit "Fix: normaliza nome do 1o artilheiro na pontuacao" (hash `88bc6bc`), confirmado como último commit em main. Vercel redeploy automático.

### Rollback
- Reverter `src/lib/scoring.ts` para a versão anterior (comparação exata `trim().toLowerCase()`) via novo upload ou `git revert 88bc6bc`.
- Depois do revert, repetir o no-op "Editar → Salvar correção" no jogo Marrocos para recalcular os pontos de volta ao estado anterior (Caique 4 pts).

### Verificado em produção (https://zucabet.vercel.app)
- `/ranking`: Caique agora em 1º lugar com **5 pts**, pill "🥇 1º gol +1" visível
- Demais participantes inalterados: Bruna 4, Camille 4, Charles 4, Ana 3, Luiz 3, Eric 0
- Pote acumulado continua Kz 60.000
