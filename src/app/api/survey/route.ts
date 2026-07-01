import { NextResponse } from "next/server";
import { insertSurvey } from "@/lib/surveys";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  CLASS_DETAILS,
  FACILITY_DETAILS,
  RESIDENCES,
  type SurveyInput,
} from "@/lib/survey";

export const runtime = "nodejs";

function bad(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

const VISIT = ["first", "2_3", "4plus"];
const RES = RESIDENCES.map((r) => r.v) as string[];
const PAID = ["yes", "depends", "no"];
const CLASSES = ["hyrox", "crossfit", "running", "yoga"];

export async function POST(req: Request) {
  if (!isSupabaseConfigured())
    return NextResponse.json(
      { ok: false, error: "서버 설정 오류" },
      { status: 500 },
    );

  let b: Partial<SurveyInput>;
  try {
    b = (await req.json()) as Partial<SurveyInput>;
  } catch {
    return bad("잘못된 요청입니다.");
  }

  const type = b.type;
  if (type !== "facility" && type !== "class") return bad("설문 유형 오류");
  if (!b.visitCount || !VISIT.includes(b.visitCount)) return bad("이용 횟수를 선택해주세요.");
  if (!b.residence || !RES.includes(b.residence)) return bad("거주지를 선택해주세요.");

  const overall = Number(b.overall);
  if (!(overall >= 1 && overall <= 5)) return bad("전체 만족도를 선택해주세요.");

  const nps = Number(b.nps);
  if (!(nps >= 0 && nps <= 10)) return bad("추천 의향을 선택해주세요.");

  // 세부 만족도 (모든 항목 필수 1~5)
  const detailDefs = type === "facility" ? FACILITY_DETAILS : CLASS_DETAILS;
  const details: Record<string, number> = {};
  for (const d of detailDefs) {
    const v = Number(b.details?.[d.key]);
    if (!(v >= 1 && v <= 5)) return bad("세부 만족도를 모두 평가해주세요.");
    details[d.key] = v;
  }

  // 클래스 전용 필수
  let classes: string[] | undefined;
  let paidIntent: SurveyInput["paidIntent"];
  if (type === "class") {
    classes = (b.classes ?? []).filter((c) => CLASSES.includes(c));
    if (classes.length === 0) return bad("참여하신 클래스를 선택해주세요.");
    if (!b.paidIntent || !PAID.includes(b.paidIntent))
      return bad("유료 전환 시 참여 의향을 선택해주세요.");
    paidIntent = b.paidIntent;
  }

  try {
    await insertSurvey({
      type,
      visitCount: b.visitCount,
      residence: b.residence,
      ageGroup: b.ageGroup,
      gender: b.gender,
      overall,
      details,
      nps,
      classes,
      paidIntent,
      priceRange: b.priceRange,
      freeGood: b.freeGood,
      freeMore: b.freeMore,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "저장 오류" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
