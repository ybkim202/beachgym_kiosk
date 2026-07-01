/**
 * 챌린지 기준 데이터 (현장 포스터 기준)
 * - A 원픽 챌린지: 8종목 × 2부문(성인 남성 / 여성·청소년), 목표 도달 판정. 성공=헤어밴드
 * - B 미니 하이록스: 7스테이션 릴레이, 5부문 완주 컷오프. 성공=비치타올
 */

export type ChallengeMode = "onepick" | "relay";
export type OnepickDivision = "male" | "female_youth";
export type RelayDivision =
  | "single_m" | "single_f" | "double_mm" | "double_ff" | "double_mf";

/* ---------------- A. 원픽 챌린지 ---------------- */
export const ONEPICK_DIVISIONS: { v: OnepickDivision; label: string }[] = [
  { v: "male", label: "성인 남성" },
  { v: "female_youth", label: "여성 및 청소년" },
];

export interface OnepickEvent {
  key: string;
  ko: string;
  en: string;
  target: Record<OnepickDivision, string>;
}

export const ONEPICK_EVENTS: OnepickEvent[] = [
  { key: "skierg", ko: "스키에르그", en: "SkiErg",
    target: { male: "500m", female_youth: "400m" } },
  { key: "sled_push", ko: "슬레드 푸시 10m", en: "Sled Push",
    target: { male: "총 101kg (45lb×2 + 35lb×2) / 40m", female_youth: "총 60kg (35lb×2) / 40m" } },
  { key: "burpee", ko: "버피 브로드 점프", en: "Burpee Jump",
    target: { male: "20m", female_youth: "20m" } },
  { key: "sled_pull", ko: "슬레드 풀 10m", en: "Sled Pull",
    target: { male: "총 83kg (45lb×2 + 15lb×2) / 40m", female_youth: "총 42kg (15lb×2) / 40m" } },
  { key: "rowing", ko: "로잉", en: "Rowing",
    target: { male: "500m", female_youth: "400m" } },
  { key: "farmers", ko: "파머스 캐리", en: "Farmers Carry",
    target: { male: "24kg×2 / 80m", female_youth: "16kg×2 / 60m" } },
  { key: "sandbag", ko: "샌드백 런지 10m", en: "Sandbag Lunge",
    target: { male: "20kg / 40m", female_youth: "10kg / 40m" } },
  { key: "wallball", ko: "월 볼", en: "Wall Ball",
    target: { male: "14lb / 40개", female_youth: "10lb / 30개" } },
];

/* ---------------- B. 미니 하이록스 (릴레이) ---------------- */
export const RELAY_DIVISIONS: { v: RelayDivision; label: string; cutoffMin: number }[] = [
  { v: "single_m", label: "단식 남", cutoffMin: 12 },
  { v: "single_f", label: "단식 여", cutoffMin: 14 },
  { v: "double_mm", label: "복식 남남", cutoffMin: 10 },
  { v: "double_ff", label: "복식 여여", cutoffMin: 12 },
  { v: "double_mf", label: "복식 남여", cutoffMin: 11 },
];

/** 릴레이 스테이션 순서 8종목 (남성 기준 / 여성·청소년 감량 병기). 무게는 원픽과 동일 */
export const RELAY_STATIONS: { ko: string; en: string; male: string; female: string }[] = [
  { ko: "스키에르그", en: "SkiErg", male: "250m", female: "200m" },
  { ko: "슬레드 푸시", en: "Sled Push", male: "20m", female: "20m" },
  { ko: "버피", en: "Burpee", male: "10m", female: "10m" },
  { ko: "슬레드 풀", en: "Sled Pull", male: "20m", female: "20m" },
  { ko: "로잉", en: "Rowing", male: "250m", female: "200m" },
  { ko: "파머스", en: "Farmers", male: "40m", female: "30m" },
  { ko: "런지", en: "Lunge", male: "20m", female: "20m" },
  { ko: "월 볼", en: "Wall Ball", male: "20개", female: "15개" },
];

/** 리워드 라벨 */
export const CHALLENGE_REWARD: Record<ChallengeMode, string> = {
  onepick: "헤어밴드",
  relay: "비치타올",
};

/* ---------------- 조회 헬퍼 ---------------- */
export function onepickEvent(key: string): OnepickEvent | undefined {
  return ONEPICK_EVENTS.find((e) => e.key === key);
}
export function relayDivision(v: string) {
  return RELAY_DIVISIONS.find((d) => d.v === v);
}
export function onepickDivisionLabel(v: string): string {
  return ONEPICK_DIVISIONS.find((d) => d.v === v)?.label ?? v;
}

/** 저장/보드 표시용 라벨 만들기 */
export function targetLabel(mode: ChallengeMode, event: string, division: string): string {
  if (mode === "onepick") {
    const e = onepickEvent(event);
    const div = division as OnepickDivision;
    return e ? `${onepickDivisionLabel(division)} · ${e.target[div] ?? ""}` : "";
  }
  const d = relayDivision(division);
  return d ? `미니 하이록스 · ${d.label} · 컷오프 ${d.cutoffMin}분` : "";
}

/** 챌린지 저장 입력 (키오스크 → API) */
export interface ChallengeInput {
  mode: ChallengeMode;
  event: string; // onepick: 종목 key / relay: "relay"
  division: string;
  participant: string; // 닉네임 또는 팀명
  passed: boolean;
  resultLabel?: string; // 실제 기록 (선택)
  elapsedMs?: number; // 릴레이 완주 시간 등
  photoUrl?: string;
  staffName?: string;
}
