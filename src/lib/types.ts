export type Gender = "male" | "female" | "other";
export type Language = "ko" | "en";
export type NotifyStatus = "pending" | "sent" | "failed" | "skipped";

/** 연령대 (생년월일 대신 선택형) */
export type AgeGroup = "10s" | "20s" | "30s" | "40s" | "50plus";
export const AGE_GROUPS: AgeGroup[] = ["10s", "20s", "30s", "40s", "50plus"];

/** 지역 (주소 대신 선택형) — 전국 17개 시·도 + 해외 */
export type Region =
  | "seoul" | "busan" | "daegu" | "incheon" | "gwangju" | "daejeon"
  | "ulsan" | "sejong" | "gyeonggi" | "gangwon" | "chungbuk" | "chungnam"
  | "jeonbuk" | "jeonnam" | "gyeongbuk" | "gyeongnam" | "jeju" | "overseas";
export const REGIONS: Region[] = [
  "seoul", "busan", "daegu", "incheon", "gwangju", "daejeon",
  "ulsan", "sejong", "gyeonggi", "gangwon", "chungbuk", "chungnam",
  "jeonbuk", "jeonnam", "gyeongbuk", "gyeongnam", "jeju", "overseas",
];

/** visits 테이블 1행 (DB 컬럼은 snake_case) */
export interface VisitRow {
  id: string;
  created_at: string; // 체크인 시각 (ISO, UTC)
  name: string;
  phone: string;
  party_size: number; // 본인 포함 동반 인원 수
  age_group: AgeGroup | null;
  gender: Gender | null;
  region: Region | null;
  language: Language;
  agreed: boolean; // 안전 동의서 동의 여부
  signed_name: string | null; // 서명 시 입력/필기한 이름
  notify_status: NotifyStatus;
  notify_channel: string | null; // 'kakao' | 'sms' | 'console'
  notify_error: string | null;
}

/** 체크인 입력 (키오스크 → API) — 모든 항목 필수 */
export interface CheckinInput {
  name: string;
  phone: string;
  partySize: number;
  ageGroup: AgeGroup;
  gender: Gender;
  region: Region;
  language: Language;
  agreed: boolean;
  signedName?: string;
}

/** 분포 묶음 (오늘/전체 공용) */
export interface Breakdowns {
  gender: Record<Gender | "unknown", number>;
  age: Record<AgeGroup | "unknown", number>;
  region: Record<Region | "unknown", number>;
  language: Record<Language, number>; // ko=내국인, en=외국인
}

/** 오늘 현황 (메인 대시보드) — 인원 수는 동반 인원(party_size) 합계 기준 */
export interface DashboardStats {
  today: number; // 오늘 누적 이용객(인원)
  week: number; // 이번 주 누적(인원)
  month: number; // 이번 달 누적(인원)
  total: number; // 전체 누적(인원)
  todayCheckins: number; // 오늘 체크인 건수(서명자 수)
  breakdown: Breakdowns; // 오늘 기준 분포 (서명자 기준)
  hourly: { hour: number; count: number }[]; // 오늘 시간대별 인원 (9~20시)
  recent: {
    id: string;
    name: string;
    partySize: number;
    createdAt: string;
    gender: Gender | null;
    ageGroup: AgeGroup | null;
    region: Region | null;
    language: Language;
    notifyStatus: NotifyStatus;
  }[];
}

/** 전체 통계 (누적 분석 페이지) — 인원 수는 동반 인원 합계 기준 */
export interface TotalStats {
  total: number; // 전체 누적(인원)
  checkins: number; // 전체 체크인 건수(서명자 수)
  days: number; // 방문이 있었던 일수
  avgPerDay: number; // 일평균(인원)
  peakDay: { date: string; count: number } | null; // 최다 일자(인원)
  breakdown: Breakdowns; // 전체 기준 분포 (서명자 기준)
  daily: { date: string; count: number }[]; // 일자별 인원 추이 (과거→현재)
}
