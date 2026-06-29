-- ============================================================
-- 일산비치짐 키오스크 — Supabase(Postgres) 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣어 1회 실행하세요.
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists public.visits (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(), -- 체크인 시각
  name          text        not null,
  phone         text        not null,
  party_size    int         not null default 1 check (party_size between 1 and 20),
  age_group     text        check (age_group in ('10s','20s','30s','40s','50plus')),
  gender        text        check (gender in ('male','female','other')),
  region        text        check (region in ('donggu','namgu','junggu','bukgu','uljugun','other')),
  language      text        not null default 'ko' check (language in ('ko','en')),
  agreed        boolean     not null default false,
  signed_name   text,
  notify_status text        not null default 'pending'
                  check (notify_status in ('pending','sent','failed','skipped')),
  notify_channel text,
  notify_error  text
);

-- 집계/조회 성능 인덱스
create index if not exists visits_created_at_idx on public.visits (created_at desc);

-- ------------------------------------------------------------
-- 인원 합계 RPC (동반 인원 반영). REST 집계함수가 막혀 있어 DB 함수로 SUM.
-- 경계 시각(KST 기준)은 앱에서 계산해 인자로 전달한다.
-- ------------------------------------------------------------
create or replace function public.people_counts(
  day_start   timestamptz,
  week_start  timestamptz,
  month_start timestamptz
) returns table (
  total_people bigint,
  month_people bigint,
  week_people  bigint,
  today_people bigint
) language sql stable as $$
  select
    coalesce(sum(party_size), 0)::bigint,
    coalesce(sum(party_size) filter (where created_at >= month_start), 0)::bigint,
    coalesce(sum(party_size) filter (where created_at >= week_start), 0)::bigint,
    coalesce(sum(party_size) filter (where created_at >= day_start), 0)::bigint
  from public.visits;
$$;

-- ------------------------------------------------------------
-- RLS: 서버(Service Role)만 접근. 익명 클라이언트 직접 접근 차단.
-- (앱은 Service Role Key로 서버에서만 읽고 씀)
-- ------------------------------------------------------------
alter table public.visits enable row level security;
-- 정책을 따로 만들지 않으므로 anon/authenticated 키로는 접근 불가.
-- Service Role Key는 RLS를 우회한다.

-- ============================================================
-- 설문 (surveys)
-- ============================================================
create table if not exists public.surveys (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  type         text not null check (type in ('facility','class')),
  visit_count  text not null check (visit_count in ('first','2_3','4plus')),
  residence    text not null check (residence in ('donggu','ulsan_other','outside')),
  age_group    text check (age_group in ('10s','20s','30s','40s','50plus')),
  gender       text check (gender in ('male','female','other')),
  overall      int  not null check (overall between 1 and 5),
  details      jsonb not null default '{}'::jsonb,
  nps          int  not null check (nps between 0 and 10),
  classes      text[],
  paid_intent  text check (paid_intent in ('yes','depends','no')),
  price_range  text,
  free_good    text,
  free_more    text
);
create index if not exists surveys_created_at_idx on public.surveys (created_at desc);
alter table public.surveys enable row level security;

-- ============================================================
-- 직원 업무 기록 (staff_logs) + 사진 스토리지
-- ============================================================
create table if not exists public.staff_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  log_date    date not null,
  kind        text not null check (kind in ('checkin','task','photo','checkout')),
  staff_name  text,
  title       text not null,
  category    text,
  photos      jsonb not null default '[]'::jsonb,
  memo        text
);
create index if not exists staff_events_date_idx on public.staff_events (log_date desc, created_at desc);
alter table public.staff_events enable row level security;

insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do nothing;
