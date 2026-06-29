import { NextResponse } from "next/server";
import { signInAdmin, signOutAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  const ok = await signInAdmin(password ?? "");
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await signOutAdmin();
  return NextResponse.json({ ok: true });
}
