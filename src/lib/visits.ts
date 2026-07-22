import "server-only";
import { getServiceClient } from "./supabase";
import { OPERATION } from "./config";
import {
  kstDateKey,
  kstParts,
  kstStartOfDay,
  kstStartOfMonth,
  kstStartOfWeek,
} from "./time";
import { REGIONS } from "./types";
import type {
  AgeGroup,
  Breakdowns,
  CheckinInput,
  DashboardStats,
  Gender,
  NotifyStatus,
  Region,
  TotalStats,
  VisitRow,
} from "./types";

/** 체크인 1건 저장. 저장된 행을 반환. */
export async function insertVisit(input: CheckinInput): Promise<VisitRow> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("visits")
    .insert({
      name: input.name.trim(),
      phone: input.phone.replace(/[^0-9]/g, ""),
      party_size: input.partySize,
      age_group: input.ageGroup,
      gender: input.gender,
      region: input.region,
      language: input.language,
      agreed: input.agreed,
      signed_name: input.signedName?.trim() || null,
      notify_status: "pending" as NotifyStatus,
    })
    .select("*")
    .single();

  if (error) throw new Error(`체크인 저장 실패: ${error.message}`);
  return data as VisitRow;
}

/** 알림 발송 결과를 visit에 반영 */
export async function updateNotifyStatus(
  id: string,
  status: NotifyStatus,
  channel: string | null,
  errorMsg?: string | null,
): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("visits")
    .update({
      notify_status: status,
      notify_channel: channel,
      notify_error: errorMsg ?? null,
    })
    .eq("id", id);
}

type RowSlim = Pick<
  VisitRow,
  "created_at" | "party_size" | "gender" | "age_group" | "region" | "language"
>;

/** 빈 분포 묶음 생성 */
function emptyBreakdowns(): Breakdowns {
  return {
    gender: { male: 0, female: 0, other: 0, unknown: 0 },
    age: { "10s": 0, "20s": 0, "30s": 0, "40s": 0, "50plus": 0, unknown: 0 },
    region: Object.fromEntries(
      [...REGIONS, "unknown"].map((k) => [k, 0]),
    ) as Breakdowns["region"],
    language: { ko: 0, en: 0 },
  };
}

/** 한 행을 분포에 누적 — 동반 인원(party_size)만큼 가중해 "전체 누적" 인원수와 합이 일치하도록 함 */
function tally(b: Breakdowns, r: RowSlim, weight: number) {
  b.gender[(r.gender as Gender) ?? "unknown"] += weight;
  b.age[(r.age_group as AgeGroup) ?? "unknown"] += weight;
  b.region[(r.region as Region) ?? "unknown"] += weight;
  b.language[r.language] += weight;
}

/** 메인 대시보드(오늘 현황) 집계 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getServiceClient();
  const now = new Date();

  const weekStart = kstStartOfWeek(now);
  const monthStart = kstStartOfMonth(now);
  const dayStart = kstStartOfDay(now);

  const [peopleRes, todayRes] = await Promise.all([
    // 인원 합계(동반 인원 반영) — DB 함수로 SUM
    supabase
      .rpc("people_counts", {
        day_start: dayStart.toISOString(),
        week_start: weekStart.toISOString(),
        month_start: monthStart.toISOString(),
      })
      .single(),
    supabase
      .from("visits")
      .select(
        "id,name,created_at,party_size,age_group,gender,region,language,notify_status",
      )
      .gte("created_at", dayStart.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  if (peopleRes.error) throw new Error(peopleRes.error.message);
  if (todayRes.error) throw new Error(todayRes.error.message);

  const people = peopleRes.data as {
    total_people: number;
    month_people: number;
    week_people: number;
    today_people: number;
  };

  const todayRows = (todayRes.data ?? []) as Pick<
    VisitRow,
    | "id"
    | "name"
    | "created_at"
    | "party_size"
    | "age_group"
    | "gender"
    | "region"
    | "language"
    | "notify_status"
  >[];

  const breakdown = emptyBreakdowns();
  const hourlyMap = new Map<number, number>();
  for (const r of todayRows) {
    const size = r.party_size ?? 1;
    tally(breakdown, r, size);
    const hr = kstParts(new Date(r.created_at)).hour;
    hourlyMap.set(hr, (hourlyMap.get(hr) ?? 0) + size);
  }

  const hourly: { hour: number; count: number }[] = [];
  for (let h = OPERATION.open.hour; h <= OPERATION.close.hour; h++) {
    hourly.push({ hour: h, count: hourlyMap.get(h) ?? 0 });
  }

  const recent = todayRows.slice(0, 15).map((r) => ({
    id: r.id,
    name: maskName(r.name),
    partySize: r.party_size ?? 1,
    createdAt: r.created_at,
    gender: (r.gender as Gender) ?? null,
    ageGroup: (r.age_group as AgeGroup) ?? null,
    region: (r.region as Region) ?? null,
    language: r.language,
    notifyStatus: r.notify_status as NotifyStatus,
  }));

  return {
    today: Number(people.today_people ?? 0),
    week: Number(people.week_people ?? 0),
    month: Number(people.month_people ?? 0),
    total: Number(people.total_people ?? 0),
    todayCheckins: todayRows.length,
    breakdown,
    hourly,
    recent,
  };
}

/** 전체 행을 페이지네이션으로 모두 가져옴 (1000행 기본 한도 우회) */
async function fetchAllVisitRows(): Promise<RowSlim[]> {
  const supabase = getServiceClient();
  const pageSize = 1000;
  const out: RowSlim[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("visits")
      .select("created_at,party_size,gender,age_group,region,language")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as RowSlim[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

/** 전체 통계(누적 분석) 집계 */
export async function getTotalStats(): Promise<TotalStats> {
  const rows = await fetchAllVisitRows();
  const breakdown = emptyBreakdowns();
  const dailyMap = new Map<string, number>();
  let total = 0; // 인원 합계

  for (const r of rows) {
    const size = r.party_size ?? 1;
    tally(breakdown, r, size); // 분포도 동반 인원 포함 — total과 합산 일치
    total += size;
    const key = kstDateKey(new Date(r.created_at));
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + size); // 일자별 인원
  }

  const daily = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const peakDay = daily.reduce<{ date: string; count: number } | null>(
    (max, d) => (!max || d.count > max.count ? d : max),
    null,
  );

  const days = dailyMap.size;
  const avgPerDay = days ? Math.round((total / days) * 10) / 10 : 0;

  return {
    total,
    checkins: rows.length,
    days,
    avgPerDay,
    peakDay,
    breakdown,
    daily,
  };
}

/** 개인정보 보호: 이름 가운데 마스킹 (홍길동 → 홍*동) */
function maskName(name: string): string {
  const n = name.trim();
  if (n.length <= 1) return n;
  if (n.length === 2) return n[0] + "*";
  return n[0] + "*".repeat(n.length - 2) + n[n.length - 1];
}
