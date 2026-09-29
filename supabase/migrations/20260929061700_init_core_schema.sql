-- athletes & plans core (1주차 화요일)
create extension if not exists "pgcrypto";

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  measurement_kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_aliases (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  alias text not null,
  source text not null default 'common',
  unique (exercise_id, alias)
);

create table if not exists public.plan_days (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  plan_date date not null,
  week_label text,
  source_text text,
  created_at timestamptz not null default now(),
  unique (athlete_id, plan_date)
);

create table if not exists public.plan_parts (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.plan_days(id) on delete cascade,
  part_type text not null default 'block',
  sort_order int not null default 0,
  raw_text text,
  score_text text
);

create table if not exists public.planned_entries (
  id uuid primary key default gen_random_uuid(),
  plan_part_id uuid not null references public.plan_parts(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  sort_order int not null default 0,
  prescription jsonb not null default '{}'::jsonb
);

create table if not exists public.logged_sets (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete set null,
  performed_at timestamptz not null default now(),
  reps int,
  weight numeric,
  weight_unit text,
  weight_kg numeric,
  distance numeric,
  duration_sec int,
  calories int,
  height numeric,
  side text,
  raw_line text,
  source text not null default 'manual'
);

create table if not exists public.parse_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  source_type text not null,
  input_hash text not null,
  ai_json jsonb,
  final_json jsonb not null,
  model text,
  parser_version text not null default '1',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  parse_plan_count int not null default 0,
  generate_plan_count int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.athletes enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_aliases enable row level security;
alter table public.plan_days enable row level security;
alter table public.plan_parts enable row level security;
alter table public.planned_entries enable row level security;
alter table public.logged_sets enable row level security;
alter table public.parse_results enable row level security;
alter table public.ai_usage enable row level security;

create policy athletes_own on public.athletes for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy exercises_read on public.exercises for select using (true);
create policy exercise_aliases_read on public.exercise_aliases for select using (true);

create policy plan_days_own on public.plan_days for all using (
  athlete_id in (select id from public.athletes where owner_user_id = auth.uid())
) with check (
  athlete_id in (select id from public.athletes where owner_user_id = auth.uid())
);

create policy plan_parts_own on public.plan_parts for all using (
  plan_day_id in (
    select pd.id from public.plan_days pd
    join public.athletes a on a.id = pd.athlete_id
    where a.owner_user_id = auth.uid()
  )
) with check (
  plan_day_id in (
    select pd.id from public.plan_days pd
    join public.athletes a on a.id = pd.athlete_id
    where a.owner_user_id = auth.uid()
  )
);

create policy planned_entries_own on public.planned_entries for all using (
  plan_part_id in (
    select pp.id from public.plan_parts pp
    join public.plan_days pd on pd.id = pp.plan_day_id
    join public.athletes a on a.id = pd.athlete_id
    where a.owner_user_id = auth.uid()
  )
) with check (
  plan_part_id in (
    select pp.id from public.plan_parts pp
    join public.plan_days pd on pd.id = pp.plan_day_id
    join public.athletes a on a.id = pd.athlete_id
    where a.owner_user_id = auth.uid()
  )
);

create policy logged_sets_own on public.logged_sets for all using (
  athlete_id in (select id from public.athletes where owner_user_id = auth.uid())
) with check (
  athlete_id in (select id from public.athletes where owner_user_id = auth.uid())
);

create policy parse_results_own on public.parse_results for all using (
  athlete_id in (select id from public.athletes where owner_user_id = auth.uid())
) with check (
  athlete_id in (select id from public.athletes where owner_user_id = auth.uid())
);

create policy ai_usage_own on public.ai_usage for all using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.exercises (key, measurement_kind) values
  ('front_squat', 'weight_reps'),
  ('back_squat', 'weight_reps'),
  ('deadlift', 'weight_reps')
on conflict (key) do nothing;
