# ZUCA BET 🇧🇷

Bolão privado da Copa 2026 — só os jogos do Brasil.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (banco de dados + API)
- **Vercel** (hospedagem)
- **Tailwind CSS**

---

## Setup em 5 passos

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (grátis)
2. Clique em **New Project**, dê um nome e aguarde
3. Vá em **Settings → API** e copie:
   - `Project URL`
   - `anon / public` key

### 2. Criar o banco de dados

1. No Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `supabase/schema.sql` e execute

### 3. Configurar variáveis de ambiente localmente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SESSION_SECRET=uma-string-longa-e-aleatoria-aqui
NEXT_PUBLIC_BET_AMOUNT=10000
```

Para gerar o SESSION_SECRET, use:
```bash
openssl rand -base64 32
```

### 4. Instalar e rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### 5. Deploy na Vercel

1. Faça push do projeto para o GitHub
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repo
3. Em **Environment Variables**, adicione as mesmas 4 variáveis do `.env.local`
4. Clique em **Deploy**

Para apontar um domínio próprio (ex: `zucabet.luizpazito.com`), vá em **Settings → Domains** na Vercel.

---

## Primeiro uso (como admin)

1. Crie o primeiro participante via SQL no Supabase:

```sql
-- Substitua 'LuizAdmin' pelo seu nome e '1234' pelo PIN desejado
-- O pin_hash deve ser gerado com bcrypt. Use o script abaixo ou o endpoint admin.
-- Forma mais simples: crie via /admin depois de criar o admin via SQL.

INSERT INTO participants (name, pin_hash, is_admin)
VALUES (
  'LuizAdmin',
  '$2b$10$xxxx', -- gere em https://bcrypt-generator.com com seu PIN
  true
);
```

Ou use este script Node para gerar o hash:

```js
// gerar-hash.js
const bcrypt = require('bcryptjs')
const pin = '1234' // seu PIN
bcrypt.hash(pin, 10).then(hash => console.log(hash))
// node gerar-hash.js
```

2. Faça login em `/login` com seu nome e PIN
3. Você será redirecionado ao painel `/admin`
4. Cadastre os demais participantes em **Participantes**
5. Cadastre os 3 jogos da fase de grupos em **Jogos**
6. Após cada jogo, lance o resultado em **Resultados**

---

## Regras do bolão

### Pontuação por jogo

| Acerto | Pontos |
|--------|--------|
| Resultado correto (vitória/empate/derrota) | 3 pts |
| Gols do Brasil corretos | 1 pt |
| Gols do adversário corretos | 1 pt |
| Placar exato | +5 pts bônus |
| Primeiro gol do Brasil correto | 1 pt |
| VAR correto (houve ou não gol anulado) | 1 pt |
| Pênalti correto (houve ou não cobrança) | 1 pt |
| Gol de cabeça correto (houve ou não) | 1 pt |
| Cartões amarelos do Brasil corretos | 1 pt |

**Máximo por jogo: 15 pontos**

### Pote da rodada

- Cada participante contribui com **Kz 10.000** por jogo (configurável em `NEXT_PUBLIC_BET_AMOUNT`)
- Quem acertar o placar exato leva o pote
- Se mais de um acertar, o pote é dividido
- Se ninguém acertar, acumula para o próximo jogo
- Se o Brasil for eliminado com pote acumulado, o líder do ranking leva

### Regras operacionais

- Palpites fecham **5 minutos** antes do início
- Palpites ficam **ocultos** até o início da partida
- Placar oficial = fim do tempo regulamentar + acréscimos (sem prorrogação/pênaltis)

---

## Estrutura do projeto

```
src/
├── app/
│   ├── login/          # Tela de login (nome + PIN)
│   ├── ranking/        # Ranking geral + próximo jogo
│   ├── bet/            # Formulário de palpite
│   ├── admin/          # Painel admin
│   │   ├── participants/  # Gerenciar participantes
│   │   ├── games/         # Gerenciar jogos
│   │   └── results/       # Lançar resultados
│   └── api/            # API Routes
├── lib/
│   ├── supabase.ts     # Cliente Supabase
│   ├── auth.ts         # JWT + sessão por cookie
│   └── scoring.ts      # Cálculo de pontos
└── types/              # Tipos TypeScript
supabase/
└── schema.sql          # Schema completo do banco
```
