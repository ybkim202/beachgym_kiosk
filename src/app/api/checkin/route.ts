import { NextResponse } from "next/server";
import { insertVisit, updateNotifyStatus } from "@/lib/visits";
import { sendCheckinNotification } from "@/lib/notify";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { AgeGroup, CheckinInput, Gender, Language, Region } from "@/lib/types";
import { AGE_GROUPS, REGIONS } from "@/lib/types";

export const runtime = "nodejs";

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return bad(
      "서버에 Supabase 환경변수가 설정되지 않았습니다. .env.local 을 확인하세요.",
      500,
    );
  }

  let body: Partial<CheckinInput>;
  try {
    body = (await req.json()) as Partial<CheckinInput>;
  } catch {
    return bad("잘못된 요청 형식입니다.");
  }

  // --- 검증 ---
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").replace(/[^0-9]/g, "");
  const language: Language = body.language === "en" ? "en" : "ko";

  if (name.length < 1) return bad("이름을 입력해주세요.");
  if (phone.length < 10 || phone.length > 11)
    return bad("휴대폰 번호를 정확히 입력해주세요.");
  if (body.agreed !== true) return bad("안전 동의가 필요합니다.");

  const partySize = Math.trunc(Number(body.partySize ?? 1));
  if (!Number.isFinite(partySize) || partySize < 1 || partySize > 20)
    return bad("동반 인원 수를 확인해주세요.");

  const ageGroup = body.ageGroup as AgeGroup | undefined;
  if (!ageGroup || !AGE_GROUPS.includes(ageGroup))
    return bad("연령대를 선택해주세요.");

  const gender = body.gender as Gender | undefined;
  if (gender !== "male" && gender !== "female" && gender !== "other")
    return bad("성별을 선택해주세요.");

  const region = body.region as Region | undefined;
  if (!region || !REGIONS.includes(region))
    return bad("주소를 선택해주세요.");

  const input: CheckinInput = {
    name,
    phone,
    partySize,
    ageGroup,
    gender,
    region,
    language,
    agreed: true,
    signedName: body.signedName?.trim() || name,
  };

  // --- 저장 ---
  let visitId: string;
  try {
    const row = await insertVisit(input);
    visitId = row.id;
  } catch (e) {
    return bad(e instanceof Error ? e.message : "체크인 저장 중 오류", 500);
  }

  // --- 알림 발송 (실패해도 체크인은 성공 처리) ---
  const result = await sendCheckinNotification(input);
  await updateNotifyStatus(
    visitId,
    result.ok ? (result.channel === "console" ? "skipped" : "sent") : "failed",
    result.channel,
    result.error,
  ).catch(() => {});

  return NextResponse.json({
    ok: true,
    id: visitId,
    notify: { ok: result.ok, channel: result.channel },
  });
}
