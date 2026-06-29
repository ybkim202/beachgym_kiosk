import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { getStaffEvents } from "@/lib/staff";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin()))
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured())
    return NextResponse.json({ ok: false, error: "서버 설정 오류" }, { status: 500 });
  try {
    return NextResponse.json({ ok: true, logs: await getStaffEvents() });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "조회 오류" },
      { status: 500 },
    );
  }
}
