-- ============================================================
-- [마이그레이션] 동반 인원(party_size) 추가
-- 이미 visits 테이블을 만든 경우, SQL Editor 에 붙여넣고 1회 실행하세요.
-- (schema.sql 을 처음부터 다시 실행하는 경우엔 불필요)
-- ============================================================

alter table public.visits
  add column if not exists party_size int not null default 1
  check (party_size between 1 and 20);

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
