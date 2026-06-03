-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Staff members
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Rounds (one active at a time)
create table rounds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fact text not null,
  answer text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Guesses per round
create table guesses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references rounds(id) on delete cascade,
  guesser text not null,
  answer text not null,
  correct boolean not null,
  created_at timestamptz default now(),
  unique(round_id, guesser)
);

-- Leaderboard (all-time points per person)
create table leaderboard (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  points integer default 0
);

-- Seed some starter staff (edit as needed)
insert into staff (name) values
  ('Saska van der Merwe'),
  ('Eike Feltz'),
  ('Dale Holtzhausen'),
  ('Amy'),
  ('Ashleigh'),
  ('David'),
  ('Mike');

-- Seed a starter round
insert into rounds (name, fact, answer) values
  ('June 2026', 'I have visited over 30 countries and once got lost in a Tokyo subway for 4 hours.', 'Eike Feltz');

-- Allow public read/write (the app has no auth — it relies on staff knowing the URL)
alter table staff enable row level security;
alter table rounds enable row level security;
alter table guesses enable row level security;
alter table leaderboard enable row level security;

create policy "Public read staff" on staff for select using (true);
create policy "Public read rounds" on rounds for select using (true);
create policy "Public read guesses" on guesses for select using (true);
create policy "Public read leaderboard" on leaderboard for select using (true);

create policy "Public insert guesses" on guesses for insert with check (true);
create policy "Public upsert leaderboard" on leaderboard for insert with check (true);
create policy "Public update leaderboard" on leaderboard for update using (true);

-- Admin policies (insert/update rounds and staff) — same open policy for simplicity
create policy "Public insert rounds" on rounds for insert with check (true);
create policy "Public update rounds" on rounds for update using (true);
create policy "Public delete rounds" on rounds for delete using (true);
create policy "Public insert staff" on staff for insert with check (true);
create policy "Public delete staff" on staff for delete using (true);
create policy "Public delete guesses" on guesses for delete using (true);
create policy "Public update leaderboard reset" on leaderboard for delete using (true);
