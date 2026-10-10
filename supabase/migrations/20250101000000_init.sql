-- Tables for the migrator app itself. No customer data is ever stored here.

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  source text not null default 'landing' check (char_length(source) <= 40),
  created_at timestamptz not null default now()
);
create unique index waitlist_email_unique on public.waitlist (lower(email));

create table public.migrations_stats (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tables_count integer not null default 0 check (tables_count >= 0),
  rows_count integer not null default 0 check (rows_count >= 0),
  users_count integer not null default 0 check (users_count >= 0),
  success boolean not null default false
);

alter table public.waitlist enable row level security;
alter table public.migrations_stats enable row level security;

-- Anonymous visitors may only INSERT. Nobody can read through the public API.
create policy "anyone can join waitlist" on public.waitlist for insert to anon, authenticated with check (true);
create policy "anyone can record anonymous stats" on public.migrations_stats for insert to anon, authenticated with check (true);
