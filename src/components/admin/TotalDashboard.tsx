"use client";
import { BASE_PATH } from "@/lib/config";

import { useEffect, useState } from "react";
import type { TotalStats } from "@/lib/types";
import { AdminHeader, BreakdownPanel, StatCard } from "./shared";

export function TotalDashboard() {
  const [stats, setStats] = useState<TotalStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(BASE_PATH + "/api/admin/total", { cache: "no-store" });
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
      } catch {
        setError("네트워크 오류");
      }
    })();
  }, []);

  return (
    <div className="bg-surface min-h-dvh">
      <AdminHeader active="/admin/total" subtitle="전체 통계 (누적)" />

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
            <StatCard label="전체 누적" value={stats.total} accent big />
            <StatCard label="운영 일수" value={stats.days} unit="일" />
            <AvgCard avg={stats.avgPerDay} />
            <PeakCard peak={stats.peakDay} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DailyChart daily={stats.daily} />
            </div>
            <BreakdownPanel breakdown={stats.breakdown} />
          </div>
        </main>
      )}
    </div>
  );
}

function AvgCard({ avg }: { avg: number }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <div className="text-muted text-sm">일평균</div>
      <div className="text-ink tnum mt-1 text-4xl font-bold">
        {avg}
        <span className="text-muted ml-1 text-base font-normal">명/일</span>
      </div>
    </div>
  );
}

function PeakCard({ peak }: { peak: TotalStats["peakDay"] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <div className="text-muted text-sm">최다 방문일</div>
      {peak ? (
        <>
          <div className="text-ink tnum mt-1 text-4xl font-bold">
            {peak.count}
            <span className="text-muted ml-1 text-base font-normal">명</span>
          </div>
          <div className="text-muted tnum mt-1 text-xs">{fmtDate(peak.date)}</div>
        </>
      ) : (
        <div className="text-muted mt-1 text-2xl">—</div>
      )}
    </div>
  );
}

function DailyChart({ daily }: { daily: TotalStats["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <h3 className="text-ink font-medium">일자별 방문 추이</h3>
      {daily.length === 0 ? (
        <p className="text-muted mt-6 text-sm">아직 데이터가 없습니다</p>
      ) : (
        <div className="mt-5 flex h-52 items-end gap-1 overflow-x-auto">
          {daily.map((d) => (
            <div
              key={d.date}
              className="flex min-w-[14px] flex-1 flex-col items-center gap-1"
              title={`${fmtDate(d.date)} · ${d.count}명`}
            >
              <span className="tnum text-ink text-[10px]">{d.count}</span>
              <div
                className="bg-marina/80 hover:bg-marina w-full rounded-t-md transition-all"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 3 }}
              />
              <span className="text-muted tnum text-[9px]">{shortDate(d.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** "2026-07-15" → "7/15" */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
/** "2026-07-15" → "2026.07.15" */
function fmtDate(iso: string): string {
  return iso.replaceAll("-", ".");
}
