import "server-only";
import { getServiceClient } from "./supabase";
import { kstDateKey } from "./time";
import {
  CHALLENGE_REWARD,
  targetLabel,
  type ChallengeInput,
} from "./challenge";

const BUCKET = "challenge-photos";

/** 인증사진 업로드 → 공개 URL */
export async function uploadChallengePhoto(file: File): Promise<string> {
  const supabase = getServiceClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeExt = /^(jpg|jpeg|png|webp|heic|heif)$/.test(ext) ? ext : "jpg";
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${kstDateKey()}/challenge-${rand}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** 챌린지 결과 1건 저장 */
export async function insertChallenge(input: ChallengeInput): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("challenges").insert({
    mode: input.mode,
    event: input.event,
    division: input.division,
    participant: input.participant,
    target_label: targetLabel(input.mode, input.event, input.division),
    result_label: input.resultLabel ?? null,
    passed: input.passed,
    elapsed_ms: input.elapsedMs ?? null,
    photo_url: input.photoUrl ?? null,
    reward: input.passed ? CHALLENGE_REWARD[input.mode] : null,
    staff_name: input.staffName ?? null,
  });
  if (error) throw new Error(`챌린지 저장 실패: ${error.message}`);
}
