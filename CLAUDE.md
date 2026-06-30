# ZUCA BET Claude Rules

## Regras de trabalho

- Do not overengineer.
- Prefer small, reversible changes.
- Before editing production files, explain the plan.
- Make backups before changes.
- Do not change unrelated code.
- Limit debugging loops to 2 attempts.
- If a fix is uncertain, propose a workaround instead of continuing indefinitely.
- After each change, report: what changed, why, files touched, rollback path.

» Criar e manter atualizado um arquivo "caderno.md" com informações relevantes, notas úteis e decisões tomadas sobre este projeto.

## Deploy via GitHub web editor (CM6)

Este projeto usa o editor web do GitHub (CodeMirror 6) para commitar arquivos. Seguir exatamente este fluxo:

1. **Verificar browser antes de qualquer coisa**: chamar `list_connected_browsers` e confirmar qual está logado no GitHub. Usar `select_browser` com o deviceId correto. **Não assumir** que o browser ativo é o logado.

2. **Substituir conteúdo**: usar a API do CM6 via JS:
   ```js
   const view = document.querySelector('.cm-content')?.cmTile?.view
   view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: novoConteudo } })
   ```
   **Importante**: verificar que `view` não é undefined antes de chamar dispatch. Aguardar carregamento da página (≥2s) antes de tentar.

3. **Abrir dialog e commitar** (tudo em um único JS com await):
   ```js
   ;[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Commit changes...')?.click()
   await new Promise(r => setTimeout(r, 1200))
   const dialog = document.querySelector('[role="dialog"]')
   const msgInput = dialog?.querySelector('input[type="text"]')
   if (msgInput) { msgInput.focus(); document.execCommand('selectAll'); document.execCommand('insertText', false, 'mensagem') }
   await new Promise(r => setTimeout(r, 300))
   dialog && [...dialog.querySelectorAll('button')].find(b => b.textContent.trim() === 'Commit changes')?.click()
   ```
   **Importante**: O `execCommand` deve rodar DENTRO do dialog já aberto, não antes. Aguardar 1200ms após clicar "Commit changes..." antes de procurar o input.

4. **Verificar sucesso**: checar se `location.href` mudou para `/blob/...` (confirma commit) ou se o dialog ainda existe (falhou).

5. **Criar arquivo novo**: navegar para `https://github.com/ivoneuman/zucabet/new/main/<pasta>`. Definir o nome do arquivo ANTES de inserir o conteúdo. O campo de nome (`aria-label="File name"`) e o campo de mensagem são diferentes — não misturar.

6. **Verificar build**: checar `https://vercel.com/ivoneumans-projects/zucabet/deployments` após os commits — build deve ficar "Ready" em ~27s.

## Quando há TypeScript build failure na Vercel

- Build que falha em < 15s = erro de TypeScript (não runtime)
- Para diagnosticar sem acesso à Vercel: verificar `https://api.github.com/repos/ivoneuman/zucabet/commits/<hash>/statuses` para pegar o link do deploy com falha
- O arquivo mais provável de ter problema: qualquer arquivo que usa tipos que mudaram (`ScoreBreakdown`, `Game`, `Bet`)
- Verificar se o conteúdo no GitHub bate com o local via `https://raw.githubusercontent.com/ivoneuman/zucabet/main/<caminho>`

## Boas práticas para próximas sessões

- **Não use o browser errado**: sempre chamar `list_connected_browsers` no início. O Cowork pode ter múltiplos browsers conectados; o GitHub só está logado em um deles.
- **Não abra novas janelas/sessões** no browser do usuário sem necessidade — use o tab já aberto com GitHub logado.
- **CM6 pode demorar a carregar**: aguardar ≥2s após navegar para `/edit/` antes de tentar acessar o editor. Verificar com `document.querySelector('.cm-content')?.cmTile?.view`.
- **Não altere arquivo errado**: conferir que o título da aba (`document.title`) bate com o arquivo esperado antes de fazer dispatch.
- **Nunca misture campos**: ao criar arquivo novo no GitHub, o `aria-label="File name"` é o nome do arquivo, não a mensagem de commit.
- **TypeScript é estrito**: ao adicionar campos em interfaces/types, atualizar TODOS os lugares que retornam aquele tipo (early returns, inits, objetos spread). Verificar com `raw.githubusercontent.com` se o arquivo commitado tem o conteúdo correto.
- **Ordem de operação recomendada**: (1) verificar browser, (2) ler arquivo local, (3) substituir via CM6, (4) commitar, (5) verificar `/blob/` URL, (6) checar build na Vercel.
