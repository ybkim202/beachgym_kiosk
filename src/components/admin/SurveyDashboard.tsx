"use client";
import { BASE_PATH } from "@/lib/config";

import { useEffect, useState } from "react";
import {
  CLASS_LABEL,
  PAID_LABEL,
  PRICE_LABEL,
  detailLabels,
  type SurveyStats,
  type SurveySummary,
  type SurveyType,
} from "@/lib/survey";
import { fmtKstDateTime } from "@/lib/time";
import { AdminHeader, Bar } from "./shared";

export function SurveyDashboard() {
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(BASE_PATH + "/api/admin/survey", { cache: "no-store" });
        if (res.status === 401) return window.location.reload();
        const json = await res.json();
        if (!json.ok) return setError(json.error || "집계 오류");
        setStats(json.stats);
      } catch {
        setError("네트워크 오류");
      }
    })();
  }, []);

  return (
    <div className="bg-surface min-h-dvh">
      <AdminHeader active="/admin/survey" subtitle="이용 만족도 설문" />
      {error && (
        <div className="bg-terracotta/10 text-terracotta mx-6 mt-4 rounded-xl px-4 py-2 text-sm">
          {error}
        </div>
      )}
      {!stats ? (
        <div className="text-muted flex h-[60vh] items-center justify-center">
          불러오는 중…
        </div>
      ) : stats.total === 0 ? (
        <div className="text-muted flex h-[60vh] items-center justify-center">
          아직 제출된 설문이 없습니다
        </div>
      ) : (
        <main className="mx-auto max-w-6xl space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SummaryCard type="facility" title="시설 이용 설문" s={stats.facility} />
            <SummaryCard type="class" title="클래스 이용 설문" s={stats.class} />
          </div>

          {stats.class.count > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <DistCard
                title="참여 클래스"
                data={stats.classCounts}
                labelMap={CLASS_LABEL}
                color="var(--terracotta)"
              />
              <DistCard
                title="유료 전환 의향"
                data={stats.paidIntent}
                labelMap={PAID_LABEL}
              />
              <DistCard
                title="적정 1회 가격대"
                data={stats.priceRange}
                labelMap={PRICE_LABEL}
                color="#3f8f6f"
              />
            </div>
          )}

          <Comments comments={stats.comments} />
        </main>
      )}
    </div>
  );
}

function SummaryCard({
  type,
  title,
  s,
}: {
  type: SurveyType;
  title: string;
  s: SurveySummary;
}) {
  const labels = Object.fromEntries(detailLabels(type).map((d) => [d.key, d.label]));
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-ink text-lg font-bold">{title}</h3>
        <span className="text-muted text-sm">응답 {s.count}건</span>
      </div>
      {s.count === 0 ? (
        <p className="text-muted mt-4 text-sm">응답 없음</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Metric label="전체 만족도" value={`${s.avgOverall}`} unit="/ 5" stars={s.avgOverall} />
            <Metric
              label="추천지수 (NPS)"
              value={`${s.npsScore > 0 ? "+" : ""}${s.npsScore}`}
              unit={`평균 ${s.avgNps}/10`}
            />
          </div>
          <div className="mt-5 space-y-3">
            <div className="text-muted text-xs">세부 만족도 (평균 / 5)</div>
            {s.detailAvg.map((d) => (
              <Bar
                key={d.key}
                label={labels[d.key] ?? d.key}
                value={d.avg}
                pct={Math.round((d.avg / 5) * 100)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  stars,
}: {
  label: string;
  value: string;
  unit: string;
  stars?: number;
}) {
  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="text-muted text-xs">{label}</div>
      <div className="text-ink tnum mt-1 text-3xl font-bold">
        {value}
        <span className="text-muted ml-1 text-sm font-normal">{unit}</span>
      </div>
      {stars !== undefined && (
        <div className="mt-1 text-amber-400">
          {"★".repeat(Math.round(stars))}
          <span className="text-line">{"★".repeat(5 - Math.round(stars))}</span>
        </div>
      )}
    </div>
  );
}

function DistCard({
  title,
  data,
  labelMap,
  color,
}: {
  title: string;
  data: Record<string, number>;
  labelMap: Record<string, string>;
  color?: string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = Math.max(1, entries.reduce((a, [, v]) => a + v, 0));
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <h3 className="text-ink font-medium">{title}</h3>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && <p className="text-muted text-sm">데이터 없음</p>}
        {entries.map(([k, v]) => (
          <Bar
            key={k}
            label={labelMap[k] ?? k}
            value={v}
            pct={Math.round((v / total) * 100)}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}

function Comments({ comments }: { comments: SurveyStats["comments"] }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <h3 className="text-ink font-medium">최근 의견</h3>
      <div className="mt-4 space-y-4">
        {comments.length === 0 && (
          <p className="text-muted text-sm">작성된 주관식 의견이 없습니다</p>
        )}
        {comments.map((c, i) => (
          <div key={i} className="border-b border-line/60 pb-4 last:border-0">
            <div className="mb-1 flex items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-0.5 ${
                  c.type === "facility"
                    ? "bg-marina-light text-marina"
                    : "bg-terracotta/10 text-terracotta"
                }`}
              >
                {c.type === "facility" ? "시설" : "클래스"}
              </span>
              <span className="text-muted">만족도 {c.overall}/5 · 추천 {c.nps}/10</span>
              <span className="text-muted ml-auto">{fmtKstDateTime(c.createdAt)}</span>
            </div>
            {c.good && <p className="text-ink/85 text-sm">💬 {c.good}</p>}
            {c.more && (
              <p className="text-ink/70 mt-1 text-sm">➕ 원하는 클래스: {c.more}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
