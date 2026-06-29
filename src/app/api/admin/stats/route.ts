import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { getDashboardStats } from "@/lib/visits";
import { isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }
  try {
    const stats = await getDashboardStats();
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "집계 오류" },
      { status: 500 },
    );
  }
}
