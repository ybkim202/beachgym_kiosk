-- ============================================================
-- [마이그레이션] 설문(surveys) + 직원 업무기록(staff_logs) + 사진 스토리지
-- Supabase SQL Editor 에 붙여넣고 1회 실행하세요.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 설문 ----------
create table if not exists public.surveys (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  type         text not null check (type in ('facility','class')),
  -- 공통 분류
  visit_count  text not null check (visit_count in ('first','2_3','4plus')),
  residence    text not null check (residence in ('donggu','ulsan_other','outside')),
  age_group    text check (age_group in ('10s','20s','30s','40s','50plus')),
  gender       text check (gender in ('male','female','other')),
  -- 만족도
  overall      int  not null check (overall between 1 and 5),
  details      jsonb not null default '{}'::jsonb, -- 세부 만족도(항목별 1~5)
  nps          int  not null check (nps between 0 and 10),
  -- 클래스 전용
  classes      text[],                              -- ['hyrox','crossfit','running','yoga']
  paid_intent  text check (paid_intent in ('yes','depends','no')),
  price_range  text,
  -- 자유 응답
  free_good    text,  -- 가장 좋았던 점/개선점
  free_more    text   -- (클래스) 추가로 원하는 클래스·시간대
);
create index if not exists surveys_created_at_idx on public.surveys (created_at desc);
alter table public.surveys enable row level security; -- 서버(Service Role)만 접근

-- ---------- 직원 업무 이벤트 (출근/업무기록/현황사진/퇴근) ----------
drop table if exists public.staff_logs;  -- 구버전 테이블 정리(있으면)
create table if not exists public.staff_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  log_date    date not null,                       -- KST 기준 근무일
  kind        text not null check (kind in ('checkin','task','photo','checkout')),
  staff_name  text,
  title       text not null,                        -- 표시용(출근/시설 청소/퇴근 등)
  category    text,                                 -- 카테고리 key
  photos      jsonb not null default '[]'::jsonb,   -- [{label,url}]
  memo        text
);
create index if not exists staff_events_date_idx on public.staff_events (log_date desc, created_at desc);
alter table public.staff_events enable row level security; -- 서버(Service Role)만 접근

-- ---------- 사진 스토리지 버킷 (공개 읽기) ----------
insert into storage.buckets (id, name, public)
values ('staff-photos', 'staff-photos', true)
on conflict (id) do nothing;
