import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { insertChallenge, uploadChallengePhoto } from "@/lib/challenges";
import {
  ONEPICK_EVENTS,
  ONEPICK_DIVISIONS,
  RELAY_DIVISIONS,
  type ChallengeMode,
} from "@/lib/challenge";

export const runtime = "nodejs";

function bad(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("잘못된 요청");
  }

  const mode = form.get("mode") as ChallengeMode;
  const event = (form.get("event") as string | null) ?? "";
  const division = (form.get("division") as string | null) ?? "";
  const participant = (form.get("participant") as string | null)?.trim() || "";
  const passed = form.get("passed") === "true";
  const resultLabel = (form.get("resultLabel") as string | null)?.trim() || undefined;
  const elapsedRaw = form.get("elapsedMs");
  const elapsedMs = elapsedRaw ? Number(elapsedRaw) : undefined;
  const staffName = (form.get("staffName") as string | null)?.trim() || undefined;

  if (mode !== "onepick" && mode !== "relay") return bad("모드 오류");
  if (!participant) return bad("닉네임/팀명을 입력해주세요.");
  if (mode === "onepick") {
    if (!ONEPICK_EVENTS.some((e) => e.key === event)) return bad("종목 오류");
    if (!ONEPICK_DIVISIONS.some((d) => d.v === division)) return bad("부문 오류");
  } else {
    if (event !== "relay") return bad("종목 오류");
    if (!RELAY_DIVISIONS.some((d) => d.v === division)) return bad("부문 오류");
  }

  let photoUrl: string | undefined;
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return bad("사진이 너무 큽니다(10MB 이하).");
    try {
      photoUrl = await uploadChallengePhoto(file);
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "사진 업로드 오류" },
        { status: 500 },
      );
    }
  }

  try {
    await insertChallenge({
      mode,
      event,
      division,
      participant,
      passed,
      resultLabel,
      elapsedMs: Number.isFinite(elapsedMs) ? elapsedMs : undefined,
      photoUrl,
      staffName,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
