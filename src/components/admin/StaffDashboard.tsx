"use client";
import { BASE_PATH } from "@/lib/config";

import { useEffect, useState } from "react";
import type { StaffEventKind, StaffEventRow } from "@/lib/staff";
import { fmtKstTime } from "@/lib/time";
import { AdminHeader } from "./shared";

const KIND_META: Record<
  StaffEventKind,
  { label: string; cls: string; emoji: string }
> = {
  checkin: { label: "출근", cls: "bg-marina text-white", emoji: "🏖️" },
  task: { label: "업무", cls: "bg-ink/80 text-white", emoji: "🧹" },
  photo: { label: "현황", cls: "bg-emerald-600 text-white", emoji: "📸" },
  checkout: { label: "퇴근", cls: "bg-terracotta text-white", emoji: "🔒" },
};

export function StaffDashboard() {
  const [events, setEvents] = useState<StaffEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(BASE_PATH + "/api/admin/staff", { cache: "no-store" });
        if (res.status === 401) return window.location.reload();
        const json = await res.json();
        if (!json.ok) return setError(json.error || "조회 오류");
        setEvents(json.logs);
      } catch {
        setError("네트워크 오류");
      }
    })();
  }, []);

  const groups: { date: string; items: StaffEventRow[] }[] = [];
  for (const e of events ?? []) {
    const g = groups.find((x) => x.date === e.log_date);
    if (g) g.items.push(e);
    else groups.push({ date: e.log_date, items: [e] });
  }

  return (
    <div className="bg-surface min-h-dvh">
      <AdminHeader active="/admin/staff" subtitle="직원 업무 기록" />
      {error && (
        <div className="bg-terracotta/10 text-terracotta mx-6 mt-4 rounded-xl px-4 py-2 text-sm">
          {error}
        </div>
      )}
      {!events ? (
        <div className="text-muted flex h-[60vh] items-center justify-center">
          불러오는 중…
        </div>
      ) : events.length === 0 ? (
        <div className="text-muted flex h-[60vh] flex-col items-center justify-center gap-2">
          <p>아직 등록된 업무 기록이 없습니다</p>
          <a href="/staff" className="text-marina text-sm underline">
            직원 기록 작성 페이지 열기
          </a>
        </div>
      ) : (
        <main className="mx-auto max-w-5xl space-y-8 p-6">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-ink text-lg font-bold">{fmtDate(g.date)}</h2>
                <DaySummary items={g.items} />
              </div>
              <div className="space-y-3">
                {g.items.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            </section>
          ))}
        </main>
      )}
    </div>
  );
}

function DaySummary({ items }: { items: StaffEventRow[] }) {
  const checkin = items.find((i) => i.kind === "checkin");
  const checkout = items.find((i) => i.kind === "checkout");
  return (
    <div className="text-muted flex gap-2 text-xs">
      {checkin && (
        <span className="rounded-full bg-marina-light text-marina px-2 py-0.5">
          출근 {fmtKstTime(checkin.created_at)}
        </span>
      )}
      {checkout && (
        <span className="bg-terracotta/10 text-terracotta rounded-full px-2 py-0.5">
          퇴근 {fmtKstTime(checkout.created_at)}
        </span>
      )}
    </div>
  );
}

function EventCard({ e }: { e: StaffEventRow }) {
  const m = KIND_META[e.kind];
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
          {m.emoji} {m.label}
        </span>
        <span className="text-ink font-medium">{e.title}</span>
        {e.staff_name && (
          <span className="text-muted text-sm">· {e.staff_name}</span>
        )}
        <span className="text-muted tnum ml-auto text-sm">
          {fmtKstTime(e.created_at)}
        </span>
      </div>

      {e.photos.length > 0 && (
        <div
          className={`mt-3 grid gap-3 ${
            e.photos.length >= 3 ? "grid-cols-3" : e.photos.length === 2 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {e.photos.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.label}
                className="h-40 w-full rounded-lg object-cover"
              />
              <span className="text-muted mt-1 block text-center text-xs">
                {p.label}
              </span>
            </a>
          ))}
        </div>
      )}

      {e.memo && (
        <p className="text-ink/70 mt-3 text-sm">📝 {e.memo}</p>
      )}
    </div>
  );
}

/** "2026-07-15" → "2026.07.15 (화)" */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = ["일", "월", "화", "수", "목", "금", "토"][
    new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  ];
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${wd})`;
}
