import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트 (Service Role Key 사용).
 * 체크인 저장/대시보드 집계 등 서버 액션·API 라우트에서만 사용한다.
 * 절대 클라이언트 번들로 노출하지 말 것 (NEXT_PUBLIC_ 접두사 사용 안 함).
 */
let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 없습니다. SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 를 .env.local 에 설정하세요.",
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** 환경변수 설정 여부 (미설정 시 안내용) */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
