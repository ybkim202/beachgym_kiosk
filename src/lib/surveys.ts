import "server-only";
import { getServiceClient } from "./supabase";
import type {
  SurveyInput,
  SurveyStats,
  SurveySummary,
  SurveyType,
} from "./survey";

interface SurveyRow {
  id: string;
  created_at: string;
  type: SurveyType;
  visit_count: string;
  residence: string;
  age_group: string | null;
  gender: string | null;
  overall: number;
  details: Record<string, number>;
  nps: number;
  classes: string[] | null;
  paid_intent: string | null;
  price_range: string | null;
  free_good: string | null;
  free_more: string | null;
}

export async function insertSurvey(input: SurveyInput): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("surveys").insert({
    type: input.type,
    visit_count: input.visitCount,
    residence: input.residence,
    age_group: input.ageGroup ?? null,
    gender: input.gender ?? null,
    overall: input.overall,
    details: input.details,
    nps: input.nps,
    classes: input.type === "class" ? (input.classes ?? []) : null,
    paid_intent: input.type === "class" ? (input.paidIntent ?? null) : null,
    price_range: input.priceRange ?? null,
    free_good: input.freeGood?.trim() || null,
    free_more: input.freeMore?.trim() || null,
  });
  if (error) throw new Error(`설문 저장 실패: ${error.message}`);
}

function summarize(rows: SurveyRow[]): SurveySummary {
  const count = rows.length;
  if (count === 0)
    return { count: 0, avgOverall: 0, avgNps: 0, npsScore: 0, detailAvg: [] };
  const sumOverall = rows.reduce((a, r) => a + r.overall, 0);
  const sumNps = rows.reduce((a, r) => a + r.nps, 0);
  const promoters = rows.filter((r) => r.nps >= 9).length;
  const detractors = rows.filter((r) => r.nps <= 6).length;
  const npsScore = Math.round(((promoters - detractors) / count) * 100);

  // 세부 항목 평균
  const sums = new Map<string, { s: number; n: number }>();
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.details ?? {})) {
      const cur = sums.get(k) ?? { s: 0, n: 0 };
      cur.s += Number(v) || 0;
      cur.n += 1;
      sums.set(k, cur);
    }
  }
  const detailAvg = [...sums.entries()].map(([key, { s, n }]) => ({
    key,
    avg: n ? Math.round((s / n) * 10) / 10 : 0,
  }));

  return {
    count,
    avgOverall: Math.round((sumOverall / count) * 10) / 10,
    avgNps: Math.round((sumNps / count) * 10) / 10,
    npsScore,
    detailAvg,
  };
}

export async function getSurveyStats(): Promise<SurveyStats> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as SurveyRow[];

  const facilityRows = rows.filter((r) => r.type === "facility");
  const classRows = rows.filter((r) => r.type === "class");

  const classCounts: Record<string, number> = {};
  const paidIntent: Record<string, number> = {};
  const priceRange: Record<string, number> = {};
  for (const r of classRows) {
    for (const c of r.classes ?? [])
      classCounts[c] = (classCounts[c] ?? 0) + 1;
    if (r.paid_intent) paidIntent[r.paid_intent] = (paidIntent[r.paid_intent] ?? 0) + 1;
    if (r.price_range) priceRange[r.price_range] = (priceRange[r.price_range] ?? 0) + 1;
  }

  const comments = rows
    .filter((r) => r.free_good || r.free_more)
    .slice(0, 50)
    .map((r) => ({
      type: r.type,
      createdAt: r.created_at,
      good: r.free_good,
      more: r.free_more,
      overall: r.overall,
      nps: r.nps,
    }));

  return {
    total: rows.length,
    facility: summarize(facilityRows),
    class: summarize(classRows),
    classCounts,
    paidIntent,
    priceRange,
    comments,
  };
}
