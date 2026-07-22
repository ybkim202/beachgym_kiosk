"use client";
import { BASE_PATH } from "@/lib/config";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { REGIONS } from "@/lib/types";
import type { AgeGroup, Breakdowns, Gender, Region } from "@/lib/types";

const ADMIN_TABS = [
  { href: "/admin", label: "오늘" },
  { href: "/admin/total", label: "전체 통계" },
  { href: "/admin/survey", label: "설문" },
  { href: "/admin/staff", label: "직원" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-black/5 p-1 text-sm">
      {ADMIN_TABS.map((t) =>
        t.href === active ? (
          <span
            key={t.href}
            className="bg-marina rounded-full px-3 py-1 font-medium text-white"
          >
            {t.label}
          </span>
        ) : (
          <Link
            key={t.href}
            href={t.href}
            className="text-ink/70 rounded-full px-3 py-1 hover:bg-white"
          >
            {t.label}
          </Link>
        ),
      )}
    </nav>
  );
}

export function AdminHeader({
  active,
  subtitle,
  children,
}: {
  active: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const logout = async () => {
    await fetch(BASE_PATH + "/api/admin/login", { method: "DELETE" });
    window.location.reload();
  };
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/90 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <LogoMark size={32} color="var(--marina)" />
        <div>
          <div className="text-ink font-medium tracking-[0.1em]">
            ILSAN BEACH GYM
          </div>
          <div className="text-muted text-xs">{subtitle}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <AdminNav active={active} />
        {children}
        <button
          onClick={logout}
          className="text-muted rounded-full border border-line px-3 py-1.5 text-sm"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}

export const GENDER_LABEL: Record<Gender | "unknown", string> = {
  male: "남성",
  female: "여성",
  other: "기타",
  unknown: "미입력",
};
export const AGE_LABEL: Record<AgeGroup | "unknown", string> = {
  "10s": "10대",
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50plus": "50대+",
  unknown: "미입력",
};
export const REGION_LABEL: Record<Region | "unknown", string> = {
  seoul: "서울", busan: "부산", daegu: "대구", incheon: "인천",
  gwangju: "광주", daejeon: "대전", ulsan: "울산", sejong: "세종",
  gyeonggi: "경기", gangwon: "강원", chungbuk: "충북", chungnam: "충남",
  jeonbuk: "전북", jeonnam: "전남", gyeongbuk: "경북", gyeongnam: "경남",
  jeju: "제주", overseas: "해외", unknown: "미입력",
};
/** 언어 → 내/외국인 구분 */
export const NAT_LABEL: Record<"ko" | "en", string> = {
  ko: "내국인",
  en: "외국인",
};

export function StatCard({
  label,
  value,
  accent,
  big,
  unit = "명",
}: {
  label: string;
  value: number;
  accent?: boolean;
  big?: boolean;
  unit?: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <div className="text-muted text-sm">{label}</div>
      <div
        className={`tnum mt-1 font-bold ${big ? "text-5xl" : "text-4xl"} ${
          accent ? "text-terracotta" : "text-ink"
        }`}
      >
        {value.toLocaleString()}
        <span className="text-muted ml-1 text-base font-normal">{unit}</span>
      </div>
    </div>
  );
}

export function Bar({
  label,
  value,
  pct,
  color = "var(--marina)",
}: {
  label: string;
  value: number;
  pct: number;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink/80">{label}</span>
        <span className="text-muted tnum">
          {value}명 · {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function Section({
  title,
  rows,
  total,
  color,
}: {
  title: string;
  rows: { k: string; label: string; v: number }[];
  total: number;
  color?: string;
}) {
  return (
    <div>
      <h3 className="text-ink font-medium">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-muted text-sm">데이터 없음</p>}
        {rows.map((r) => (
          <Bar
            key={r.k}
            label={r.label}
            value={r.v}
            pct={Math.round((r.v / total) * 100)}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}

function rowsFrom<K extends string>(
  order: readonly K[],
  data: Record<K, number>,
  label: Record<K, string>,
) {
  return order
    .map((k) => ({ k, label: label[k], v: data[k] }))
    .filter((r) => r.v > 0);
}

/** 성별·연령대·지역·내외국인 분포 패널 (오늘/전체 공용, 동반 인원 포함 — 전체 누적과 합산 일치) */
export function BreakdownPanel({ breakdown }: { breakdown: Breakdowns }) {
  // 분모 = 인원 합계(동반 인원 포함) = 성별 분포 합
  const denom = Math.max(
    1,
    Object.values(breakdown.gender).reduce((a, b) => a + b, 0),
  );
  const genderRows = rowsFrom(
    ["male", "female", "other", "unknown"] as const,
    breakdown.gender,
    GENDER_LABEL,
  );
  const ageRows = rowsFrom(
    ["10s", "20s", "30s", "40s", "50plus", "unknown"] as const,
    breakdown.age,
    AGE_LABEL,
  );
  const regionRows = rowsFrom(
    [...REGIONS, "unknown"] as const,
    breakdown.region,
    REGION_LABEL,
  );
  const natTotal = Math.max(1, breakdown.language.ko + breakdown.language.en);

  return (
    <div className="space-y-6 rounded-3xl border border-line bg-white p-6">
      <p className="text-muted -mb-2 text-xs">
        분포는 전체 인원(동반 포함) {denom}명 기준
      </p>
      <Section title="성별" rows={genderRows} total={denom} />
      <Section title="연령대" rows={ageRows} total={denom} color="var(--marina-dark)" />
      <Section title="지역" rows={regionRows} total={denom} color="#3f8f6f" />
      <div>
        <h3 className="text-ink font-medium">내·외국인</h3>
        <div className="mt-4 space-y-3">
          <Bar
            label={NAT_LABEL.ko}
            value={breakdown.language.ko}
            pct={Math.round((breakdown.language.ko / natTotal) * 100)}
          />
          <Bar
            label={NAT_LABEL.en}
            value={breakdown.language.en}
            pct={Math.round((breakdown.language.en / natTotal) * 100)}
            color="var(--terracotta)"
          />
        </div>
      </div>
    </div>
  );
}

export function NotifyBadge({ status }: { status: string }) {
  const map: Record<string, { t: string; c: string }> = {
    sent: { t: "발송", c: "text-green-600 bg-green-50" },
    failed: { t: "실패", c: "text-terracotta bg-terracotta/10" },
    pending: { t: "대기", c: "text-amber-600 bg-amber-50" },
    skipped: { t: "미연동", c: "text-muted bg-black/5" },
  };
  const m = map[status] ?? map.skipped;
  return <span className={`rounded-full px-2 py-0.5 text-xs ${m.c}`}>{m.t}</span>;
}
