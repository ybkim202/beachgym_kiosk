import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  insertStaffEvent,
  uploadStaffPhoto,
  type StaffEventKind,
  type StaffPhoto,
} from "@/lib/staff";

export const runtime = "nodejs";

const KINDS: StaffEventKind[] = ["checkin", "task", "photo", "checkout"];

export async function POST(req: Request) {
  if (!(await isAdmin()))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  const kind = form.get("kind") as StaffEventKind;
  if (!KINDS.includes(kind))
    return NextResponse.json({ ok: false, error: "종류 오류" }, { status: 400 });

  const staffName = (form.get("staffName") as string | null)?.trim() || null;
  const title = (form.get("title") as string | null)?.trim() || "";
  const category = (form.get("category") as string | null)?.trim() || null;
  const memo = (form.get("memo") as string | null)?.trim() || null;

  if (kind === "checkin" && !staffName)
    return NextResponse.json(
      { ok: false, error: "출근 등록에는 이름이 필요합니다." },
      { status: 400 },
    );

  const count = Number(form.get("photoCount") ?? 0);
  const photos: StaffPhoto[] = [];
  for (let i = 0; i < count; i++) {
    const file = form.get(`photo_${i}`);
    const label = (form.get(`label_${i}`) as string | null)?.trim() || "사진";
    if (!(file instanceof File) || file.size === 0) continue;
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json(
        { ok: false, error: `${label} 사진이 너무 큽니다(10MB 이하).` },
        { status: 400 },
      );
    try {
      const url = await uploadStaffPhoto(file, `${kind}-${category ?? "x"}`);
      photos.push({ label, url });
    } catch (e) {
      return NextResponse.json(
        { ok: false, error: e instanceof Error ? e.message : "사진 업로드 오류" },
        { status: 500 },
      );
    }
  }

  if (photos.length === 0)
    return NextResponse.json(
      { ok: false, error: "사진을 1장 이상 첨부해주세요." },
      { status: 400 },
    );

  try {
    await insertStaffEvent({
      kind,
      staffName,
      title: title || kindTitle(kind),
      category,
      photos,
      memo,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "저장 오류" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

function kindTitle(kind: StaffEventKind): string {
  return kind === "checkin"
    ? "출근"
    : kind === "checkout"
      ? "퇴근"
      : kind === "task"
        ? "업무 기록"
        : "현황 사진";
}
