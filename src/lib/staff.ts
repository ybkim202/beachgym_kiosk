import "server-only";
import { getServiceClient } from "./supabase";
import { kstDateKey } from "./time";

const BUCKET = "staff-photos";

export type StaffEventKind = "checkin" | "task" | "photo" | "checkout";

export interface StaffPhoto {
  label: string;
  url: string;
}

export interface StaffEventRow {
  id: string;
  created_at: string;
  log_date: string;
  kind: StaffEventKind;
  staff_name: string | null;
  title: string; // 표시용 (예: "출근", "시설 청소", "퇴근")
  category: string | null; // 카테고리 key
  photos: StaffPhoto[];
  memo: string | null;
}

/** 사진 1장을 스토리지에 업로드하고 공개 URL 반환 */
export async function uploadStaffPhoto(
  file: File,
  prefix: string,
): Promise<string> {
  const supabase = getServiceClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = /^(jpg|jpeg|png|webp|heic|heif)$/.test(ext) ? ext : "jpg";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${kstDateKey()}/${prefix}-${rand}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function insertStaffEvent(input: {
  kind: StaffEventKind;
  staffName: string | null;
  title: string;
  category: string | null;
  photos: StaffPhoto[];
  memo: string | null;
}): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("staff_events").insert({
    log_date: kstDateKey(),
    kind: input.kind,
    staff_name: input.staffName,
    title: input.title,
    category: input.category,
    photos: input.photos,
    memo: input.memo,
  });
  if (error) throw new Error(`기록 저장 실패: ${error.message}`);
}

/** 최근 직원 이벤트 (관리자용) */
export async function getStaffEvents(limit = 200): Promise<StaffEventRow[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("staff_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffEventRow[];
}
