/**
 * 일산비치짐 · 해파랑 웰니스파크 운영 설정
 * (운영계획서 기준값 — 필요 시 환경변수로 덮어쓸 수 있게 구성)
 */

export const BRAND = {
  nameKo: "일산비치짐",
  nameEn: "ILSAN BEACH GYM",
  tagline: "해파랑길 · 울산 동구",
  subtitle: "해파랑 웰니스파크",
} as const;

/** 운영 기간/시간 (KST 기준) */
export const OPERATION = {
  season: { start: "2026-07-01", end: "2026-08-31" },
  /** 운영 시작 시각 (시, 분) */
  open: { hour: 10, minute: 0 },
  /** 운영 종료 시각 — 이 시각이 지나면 '현재 이용객'에서 자동 제외(자동 마감) */
  close: { hour: 20, minute: 0 },
  /** 정원 (평일/주말) — 대시보드 혼잡도 표시에 사용 */
  capacity: { weekday: 20, weekend: 18 },
  /**
   * 1인 최대 체류 시간(분). 운영 종료 전이라도 체크인 후 이 시간이 지나면
   * '현재 이용객'에서 자동 제외한다. (기본: 운영시간 전체에 가깝게 길게)
   */
  maxStayMinutes: Number(process.env.MAX_STAY_MINUTES ?? 240),
  /** 이용료 표기 (무료 운영) */
  feeLabel: "무료 이용",
} as const;

/** 키오스크 5단계 STEP4에서 노출할 외부 링크 + 알림톡에 담을 링크 */
export const LINKS = {
  homepage: process.env.NEXT_PUBLIC_HOMEPAGE_URL ?? "https://ilsanbeachgym.com",
  /** 클래스(하이록스·크로스핏·러닝·요가) 예약 사이트 */
  reservation:
    process.env.NEXT_PUBLIC_RESERVATION_URL ?? "https://ilsanbeachgym.com/",
  survey:
    process.env.NEXT_PUBLIC_SURVEY_URL ?? "https://ilsanbeachgym.com/survey",
  /** 기구 사용법 QR이 연결되는 가이드 페이지 */
  guide: process.env.NEXT_PUBLIC_GUIDE_URL ?? "https://ilsanbeachgym.com/guide",
} as const;

/** 프로그램 (운영계획서 Program Identity) */
export const PROGRAMS = [
  {
    no: "01",
    zone: "The Deck",
    title: "HYROX Challenge",
    titleKo: "하이록스 챌린지",
    desc: "스키에르그·슬레드·로잉·파머스 등 8종목 비치 챌린지. 원픽(개인)/릴레이(2인 1팀).",
    color: "#1a1a1a",
  },
  {
    no: "02",
    zone: "The Deck",
    title: "CROSSFIT Station",
    titleKo: "크로스핏 스테이션",
    desc: "클러스터 프레임·바벨·케틀벨. 강사 상주 오후 클래스. QR코드 기구 사용법 안내.",
    color: "#1f2d3a",
  },
  {
    no: "03",
    zone: "The Deck",
    title: "RUNNER Station",
    titleKo: "러너 스테이션",
    desc: "짐 보관·키오스크·인포데스크. 해파랑길 러닝크루 공식 거점. 매주 정기 런클럽.",
    color: "#c85840",
  },
  {
    no: "04",
    zone: "East Sea",
    title: "SEA Plunge",
    titleKo: "씨 플런지",
    desc: "동해 그 자체가 콜드플런지.",
    color: "#437eba",
  },
] as const;

/** 이번 주 클래스 (STEP4 홍보 — 운영 중 수정 가능하도록 단순 상수로 분리) */
export const WEEKLY_CLASSES = [
  { day: "매일", time: "09:00–20:00", name: "프리 트레이닝 (The Deck)" },
  { day: "화·목", time: "18:00", name: "크로스핏 클래스 (강사 상주)" },
  { day: "토", time: "07:00", name: "해파랑길 런클럽" },
  { day: "일", time: "08:00", name: "선셋 모빌리티 & 씨 플런지" },
] as const;

export const ADMIN = {
  /** 관리자 웹 접근 비밀번호 (배포 시 반드시 환경변수로 설정) */
  password: process.env.ADMIN_PASSWORD ?? "beachgym2026",
} as const;

/**
 * 직원 기능 카테고리 (각 항목 사진 첨부).
 * ※ 자유롭게 추가/수정하세요. key 는 영문 고유값.
 */

/** 업무 기록(수시) 종류 */
export const STAFF_TASK_CATEGORIES = [
  { key: "cleaning", label: "시설 청소" },
  { key: "equipment", label: "운동기구 정리" },
  { key: "safety", label: "안전시설 점검" },
] as const;

/** 비정기 현황 사진 종류 */
export const STAFF_PHOTO_CATEGORIES = [
  { key: "status", label: "현황" },
  { key: "cleaning", label: "시설 청소" },
  { key: "equipment", label: "운동기구 정리" },
] as const;

/** 퇴근 등록 시 필수 사진 (전부 촬영해야 퇴근 가능) */
export const STAFF_CHECKOUT_PHOTOS = [
  { key: "cleaning", label: "시설 청소" },
  { key: "equipment", label: "운동기구 정리" },
  { key: "barrier", label: "진입금지 줄 설치" },
] as const;

