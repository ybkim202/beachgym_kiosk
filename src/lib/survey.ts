/** 설문 옵션·라벨 정의 (국문 전용 — 카카오 링크로 내국인 대상) */

export type SurveyType = "facility" | "class";
export type VisitCount = "first" | "2_3" | "4plus";
export type Residence = "donggu" | "ulsan_other" | "outside";
export type PaidIntent = "yes" | "depends" | "no";

export const VISIT_COUNTS: { v: VisitCount; label: string }[] = [
  { v: "first", label: "처음" },
  { v: "2_3", label: "2~3회" },
  { v: "4plus", label: "4회 이상" },
];

export const RESIDENCES: { v: Residence; label: string }[] = [
  { v: "donggu", label: "동구" },
  { v: "ulsan_other", label: "울산 내 타 구·군" },
  { v: "outside", label: "울산 외" },
];

export const SURVEY_AGE_GROUPS = [
  { v: "10s", label: "10대" },
  { v: "20s", label: "20대" },
  { v: "30s", label: "30대" },
  { v: "40s", label: "40대" },
  { v: "50plus", label: "50대 이상" },
] as const;

export const SURVEY_GENDERS = [
  { v: "male", label: "남성" },
  { v: "female", label: "여성" },
  { v: "other", label: "기타" },
] as const;

export const SURVEY_CLASSES = [
  { v: "hyrox", label: "하이록스" },
  { v: "crossfit", label: "크로스핏" },
  { v: "running", label: "러닝" },
  { v: "yoga", label: "요가" },
] as const;

export const PAID_INTENTS: { v: PaidIntent; label: string }[] = [
  { v: "yes", label: "참여" },
  { v: "depends", label: "가격에 따라" },
  { v: "no", label: "안 함" },
];

export const PRICE_RANGES = [
  { v: "under1", label: "1만원 이하" },
  { v: "1to2", label: "1~2만원" },
  { v: "2to3", label: "2~3만원" },
  { v: "over3", label: "3만원 이상" },
] as const;

/** 세부 만족도 항목 (시설) */
export const FACILITY_DETAILS = [
  { key: "equipment", label: "시설·기구 상태" },
  { key: "cleanliness", label: "청결·위생" },
  { key: "ambience", label: "공간 쾌적함·분위기" },
  { key: "convenience", label: "예약·이용 편의성" },
  { key: "access", label: "위치·접근성·주차" },
] as const;

/** 세부 만족도 항목 (클래스) */
export const CLASS_DETAILS = [
  { key: "coaching", label: "강사·코칭 전문성" },
  { key: "program", label: "프로그램 구성·난이도 적절성" },
  { key: "equipment", label: "운동 기구·장비 상태" },
  { key: "cleanliness", label: "청결·위생" },
  { key: "booking", label: "예약·신청 편의성" },
  { key: "access", label: "위치·접근성·주차" },
] as const;

export function detailLabels(type: SurveyType) {
  return type === "facility" ? FACILITY_DETAILS : CLASS_DETAILS;
}

/** 설문 제출 입력 (클라이언트 → API) */
export interface SurveyInput {
  type: SurveyType;
  visitCount: VisitCount;
  residence: Residence;
  ageGroup?: string;
  gender?: string;
  overall: number; // 1~5
  details: Record<string, number>; // 항목별 1~5
  nps: number; // 0~10
  classes?: string[]; // 클래스 전용
  paidIntent?: PaidIntent; // 클래스 전용
  priceRange?: string; // 클래스 전용(선택)
  freeGood?: string;
  freeMore?: string; // 클래스 전용
}

/* ---------- 집계 결과 타입 (관리자 공용) ---------- */
export interface SurveySummary {
  count: number;
  avgOverall: number;
  avgNps: number;
  npsScore: number; // 순추천지수(-100~100)
  detailAvg: { key: string; avg: number }[];
}

export interface SurveyStats {
  total: number;
  facility: SurveySummary;
  class: SurveySummary;
  classCounts: Record<string, number>;
  paidIntent: Record<string, number>;
  priceRange: Record<string, number>;
  comments: {
    type: SurveyType;
    createdAt: string;
    good: string | null;
    more: string | null;
    overall: number;
    nps: number;
  }[];
}

export const PRICE_LABEL: Record<string, string> = Object.fromEntries(
  PRICE_RANGES.map((p) => [p.v, p.label]),
);
export const VISIT_LABEL: Record<string, string> = Object.fromEntries(
  VISIT_COUNTS.map((p) => [p.v, p.label]),
);
export const RESIDENCE_LABEL: Record<string, string> = Object.fromEntries(
  RESIDENCES.map((p) => [p.v, p.label]),
);
export const CLASS_LABEL: Record<string, string> = Object.fromEntries(
  SURVEY_CLASSES.map((p) => [p.v, p.label]),
);
export const PAID_LABEL: Record<string, string> = Object.fromEntries(
  PAID_INTENTS.map((p) => [p.v, p.label]),
);
