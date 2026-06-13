-- ZUCA BET — Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase

-- ─────────────────────────────────────────────
-- 1. PARTICIPANTES
-- ─────────────────────────────────────────────
create table if not exists participants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  pin_hash    text not null,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. JOGOS DO BRASIL
-- ─────────────────────────────────────────────
create table if not exists games (
  id              uuid primary key default gen_random_uuid(),
  phase           text not null default 'group',   -- 'group' | 'round_of_16' | 'quarter' | 'semi' | 'final'
  opponent        text not null,
  game_date       timestamptz not null,             -- horário oficial de início
  status          text not null default 'upcoming', -- 'upcoming' | 'open' | 'finished'

  -- Resultado (preenchido pelo admin)
  brazil_goals        int,
  opponent_goals      int,
  first_goal_type     text,   -- 'player' | 'own_goal' | 'no_goal'
  first_goal_player   text,   -- nome do jogador (quando first_goal_type = 'player')
  var_annulled        boolean,
  penalty             boolean,
  header_goal         boolean,
  brazil_yellow_cards int,

  -- Pote da rodada
  pot_carried_in  int not null default 0,  -- valor acumulado de jogos anteriores
  pot_winner_id   uuid references participants(id), -- quem ganhou o pote (null = acumulou)

  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3. PALPITES
-- ─────────────────────────────────────────────
create table if not exists bets (
  id                    uuid primary key default gen_random_uuid(),
  participant_id        uuid not null references participants(id) on delete cascade,
  game_id               uuid not null references games(id) on delete cascade,

  -- Palpite
  brazil_goals          int not null,
  opponent_goals        int not null,
  first_goal_type       text not null,   -- 'player' | 'own_goal' | 'no_goal'
  first_goal_player     text,            -- obrigatório quando first_goal_type = 'player'
  var_annulled          boolean not null,
  penalty               boolean not null,
  header_goal           boolean not null,
  brazil_yellow_cards   int not null,

  -- Pontuação (calculada após o resultado)
  points                int,

  created_at  timestamptz not null default now(),

  unique (participant_id, game_id)
);

-- ─────────────────────────────────────────────
-- 4. ESTADO GLOBAL DO POTE
-- ─────────────────────────────────────────────
create table if not exists pot_state (
  id              int primary key default 1 check (id = 1),  -- singleton
  accumulated     int not null default 0,
  updated_at      timestamptz not null default now()
);

insert into pot_state (id, accumulated) values (1, 0)
  on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table participants   enable row level security;
alter table games          enable row level security;
alter table bets           enable row level security;
alter table pot_state      enable row level security;

-- Participants: leitura pública (nomes/ranking visíveis a todos logados)
create policy "participants_select" on participants for select using (true);
create policy "participants_insert_admin" on participants for insert with check (true);
create policy "participants_update_admin" on participants for update using (true);

-- Games: leitura pública
create policy "games_select" on games for select using (true);
create policy "games_all_admin" on games for all using (true);

-- Bets:
--   - Participante vê seus próprios palpites sempre
--   - Todos veem palpites de jogos com status != 'upcoming'/'open' (jogo iniciado)
--   - Admin vê tudo
create policy "bets_select_own" on bets for select
  using (true);  -- filtro de visibilidade feito na aplicação

create policy "bets_insert" on bets for insert with check (true);
create policy "bets_update_admin" on bets for update using (true);

-- Pot state: leitura pública
create policy "pot_select" on pot_state for select using (true);
create policy "pot_update_admin" on pot_state for update using (true);

-- ─────────────────────────────────────────────
-- 6. ÍNDICES
-- ─────────────────────────────────────────────
create index if not exists bets_game_id_idx         on bets (game_id);
create index if not exists bets_participant_id_idx  on bets (participant_id);
create index if not exists games_status_idx         on games (status);
create index if not exists games_date_idx           on games (game_date);
