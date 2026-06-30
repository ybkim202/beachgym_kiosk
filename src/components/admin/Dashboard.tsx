"use client";
import { BASE_PATH } from "@/lib/config";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardStats } from "@/lib/types";
import { fmtKstTime } from "@/lib/time";
import {
  AdminHeader,
  AGE_LABEL,
  BreakdownPanel,
  GENDER_LABEL,
  NAT_LABEL,
  NotifyBadge,
  REGION_LABEL,
  StatCard,
} from "./shared";

const POLL_MS = 15000; // 무료 플랜 egress 절약 (탭 백그라운드 시 추가로 정지)

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [live, setLive] = useState(true);
  const liveRef = useRef(live);
  liveRef.current = live;

  const load = useCallback(async () => {
    try {
      const res = await fetch(BASE_PATH + "/api/admin/stats", { cache: "no-store" });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "집계 오류");
        return;
      }
      setStats(json.stats);
      setUpdatedAt(new Date());
      setError(null);
    } catch {
      setError("네트워크 오류 — 재시도 중");
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (liveRef.current && !document.hidden) load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden && liveRef.current) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return (
    <div className="bg-surface min-h-dvh">
      <AdminHeader active="/admin" subtitle="오늘 현황">
        <button
          onClick={() => setLive((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm"
        >
          <span
            className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-green-500" : "bg-gray-400"}`}
          />
          {live ? "실시간" : "일시정지"}
        </button>
        <span className="text-muted hidden text-xs sm:inline">
          {updatedAt ? `${fmtKstTime(updatedAt)} 업데이트` : "—"}
        </span>
      </AdminHeader>

      {error && (
        <div className="bg-terracotta/10 text-terracotta mx-6 mt-4 rounded-xl px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {!stats ? (
        <div className="text-muted flex h-[60vh] items-center justify-center">
          불러오는 중…
        </div>
      ) : (
        <main className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="오늘 누적" value={stats.today} accent big />
            <StatCard label="이번 주" value={stats.week} />
            <StatCard label="이번 달" value={stats.month} />
            <StatCard label="전체 누적" value={stats.total} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HourlyChart hourly={stats.hourly} />
            </div>
            <BreakdownPanel breakdown={stats.breakdown} />
          </div>

          <RecentTable recent={stats.recent} />
        </main>
      )}
    </div>
  );
}

function HourlyChart({ hourly }: { hourly: DashboardStats["hourly"] }) {
  const max = Math.max(1, ...hourly.map((h) => h.count));
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <h3 className="text-ink font-medium">오늘 시간대별 체크인</h3>
      <div className="mt-5 flex h-44 items-end gap-1.5">
        {hourly.map((h) => (
          <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
            <span className="tnum text-ink text-xs">
              {h.count > 0 ? h.count : ""}
            </span>
            <div
              className="bg-marina/80 hover:bg-marina w-full rounded-t-md transition-all"
              style={{ height: `${(h.count / max) * 100}%`, minHeight: h.count ? 4 : 0 }}
            />
            <span className="text-muted tnum text-[10px]">{h.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTable({ recent }: { recent: DashboardStats["recent"] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <h3 className="text-ink font-medium">최근 체크인</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted border-b border-line text-left">
              <th className="pb-2 font-normal">시간</th>
              <th className="pb-2 font-normal">이름</th>
              <th className="pb-2 font-normal">성별</th>
              <th className="pb-2 font-normal">연령대</th>
              <th className="pb-2 font-normal">지역</th>
              <th className="pb-2 font-normal">구분</th>
              <th className="pb-2 font-normal">알림</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={7} className="text-muted py-6 text-center">
                  오늘 체크인 내역이 없습니다
                </td>
              </tr>
            )}
            {recent.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0">
                <td className="tnum py-2.5">{fmtKstTime(r.createdAt)}</td>
                <td className="py-2.5 font-medium">
                  {r.name}
                  {r.partySize > 1 && (
                    <span className="text-marina ml-1 text-xs">
                      외 {r.partySize - 1}명
                    </span>
                  )}
                </td>
                <td className="py-2.5">{r.gender ? GENDER_LABEL[r.gender] : "—"}</td>
                <td className="py-2.5">{r.ageGroup ? AGE_LABEL[r.ageGroup] : "—"}</td>
                <td className="py-2.5">{r.region ? REGION_LABEL[r.region] : "—"}</td>
                <td className="py-2.5">{NAT_LABEL[r.language]}</td>
                <td className="py-2.5">
                  <NotifyBadge status={r.notifyStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
