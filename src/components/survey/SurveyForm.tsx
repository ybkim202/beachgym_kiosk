"use client";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";
import {
  CLASS_DETAILS,
  FACILITY_DETAILS,
  PAID_INTENTS,
  PRICE_RANGES,
  RESIDENCES,
  SURVEY_AGE_GROUPS,
  SURVEY_CLASSES,
  SURVEY_GENDERS,
  VISIT_COUNTS,
  type SurveyType,
} from "@/lib/survey";

type Step = "intro" | "form" | "done";

interface FormState {
  visitCount?: string;
  residence?: string;
  ageGroup?: string;
  gender?: string;
  overall?: number;
  details: Record<string, number>;
  nps?: number;
  classes: string[];
  paidIntent?: string;
  priceRange?: string;
  freeGood: string;
  freeMore: string;
}

const EMPTY: FormState = { details: {}, classes: [], freeGood: "", freeMore: "" };

export function SurveyForm() {
  const [step, setStep] = useState<Step>("intro");
  const [type, setType] = useState<SurveyType>("facility");
  const [f, setF] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const detailDefs = type === "facility" ? FACILITY_DETAILS : CLASS_DETAILS;

  const start = (t: SurveyType) => {
    setType(t);
    setF(EMPTY);
    setError(null);
    setStep("form");
  };

  const validate = (): string | null => {
    if (type === "class" && f.classes.length === 0)
      return "참여하신 클래스를 선택해주세요.";
    if (!f.visitCount) return "이용 횟수를 선택해주세요.";
    if (!f.residence) return "거주지를 선택해주세요.";
    if (!f.overall) return "전체 만족도를 평가해주세요.";
    for (const d of detailDefs)
      if (!f.details[d.key]) return "세부 만족도를 모두 평가해주세요.";
    if (f.nps === undefined) return "추천 의향을 선택해주세요.";
    if (type === "class" && !f.paidIntent)
      return "유료 전환 시 참여 의향을 선택해주세요.";
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          visitCount: f.visitCount,
          residence: f.residence,
          ageGroup: f.ageGroup,
          gender: f.gender,
          overall: f.overall,
          details: f.details,
          nps: f.nps,
          classes: type === "class" ? f.classes : undefined,
          paidIntent: type === "class" ? f.paidIntent : undefined,
          priceRange: type === "class" ? f.priceRange : undefined,
          freeGood: f.freeGood,
          freeMore: type === "class" ? f.freeMore : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "제출 중 오류가 발생했어요.");
        setSubmitting(false);
        return;
      }
      setStep("done");
      window.scrollTo({ top: 0 });
    } catch {
      setError("네트워크 오류 — 다시 시도해주세요.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-dvh">
      <div className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-28 pt-8 shadow-sm">
        <div className="flex flex-col items-center">
          <LogoMark size={44} color="var(--marina)" />
          <div className="text-ink mt-2 text-lg font-light tracking-[0.12em]">
            ILSAN BEACH GYM
          </div>
        </div>

        {step === "intro" && <Intro onPick={start} />}

        {step === "done" && <Done />}

        {step === "form" && (
          <div className="mt-6 space-y-8">
            {error && (
              <div className="bg-terracotta/10 text-terracotta rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* 클래스: 참여 클래스 */}
            {type === "class" && (
              <Q title="참여하신 클래스" required hint="복수 선택 가능">
                <Chips
                  options={SURVEY_CLASSES}
                  values={f.classes}
                  onToggle={(v) =>
                    set(
                      "classes",
                      f.classes.includes(v)
                        ? f.classes.filter((x) => x !== v)
                        : [...f.classes, v],
                    )
                  }
                />
              </Q>
            )}

            <Q title="이용 횟수" required>
              <Single
                options={VISIT_COUNTS}
                value={f.visitCount}
                onSelect={(v) => set("visitCount", v)}
              />
            </Q>

            <Q title="거주지" required>
              <Single
                options={RESIDENCES}
                value={f.residence}
                onSelect={(v) => set("residence", v)}
              />
            </Q>

            <Q title="연령대" hint="선택">
              <Single
                options={SURVEY_AGE_GROUPS}
                value={f.ageGroup}
                onSelect={(v) => set("ageGroup", f.ageGroup === v ? undefined : v)}
              />
            </Q>

            <Q title="성별" hint="선택">
              <Single
                options={SURVEY_GENDERS}
                value={f.gender}
                onSelect={(v) => set("gender", f.gender === v ? undefined : v)}
              />
            </Q>

            <Q title="전체 만족도" required>
              <Stars value={f.overall} onSelect={(v) => set("overall", v)} />
            </Q>

            <Q title="세부 만족도" required hint="항목별 5점">
              <div className="space-y-4">
                {detailDefs.map((d) => (
                  <div key={d.key}>
                    <div className="text-ink/80 mb-1.5 text-sm">{d.label}</div>
                    <Scale5
                      value={f.details[d.key]}
                      onSelect={(v) =>
                        set("details", { ...f.details, [d.key]: v })
                      }
                    />
                  </div>
                ))}
              </div>
            </Q>

            <Q title="추천 의향" required hint="0 = 전혀 / 10 = 매우">
              <Scale11 value={f.nps} onSelect={(v) => set("nps", v)} />
            </Q>

            <Q title="가장 좋았던 점 / 개선점" hint="선택">
              <textarea
                value={f.freeGood}
                onChange={(e) => set("freeGood", e.target.value)}
                rows={3}
                className="w-full rounded-xl border-2 border-line p-3 text-base focus:border-marina focus:outline-none"
                placeholder="자유롭게 적어주세요"
              />
            </Q>

            {type === "class" && (
              <>
                <Q title="추가로 원하는 클래스·시간대" hint="선택">
                  <textarea
                    value={f.freeMore}
                    onChange={(e) => set("freeMore", e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border-2 border-line p-3 text-base focus:border-marina focus:outline-none"
                    placeholder="예) 평일 저녁 요가, 주말 오전 러닝 등"
                  />
                </Q>

                <Q title="유료 전환 시 참여 의향" required>
                  <Single
                    options={PAID_INTENTS}
                    value={f.paidIntent}
                    onSelect={(v) => set("paidIntent", v)}
                  />
                </Q>

                <Q title="적정 1회 가격대" hint="선택">
                  <Single
                    options={PRICE_RANGES}
                    value={f.priceRange}
                    onSelect={(v) =>
                      set("priceRange", f.priceRange === v ? undefined : v)
                    }
                  />
                </Q>
              </>
            )}
          </div>
        )}
      </div>

      {step === "form" && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-lg border-t border-line bg-white p-4">
          <button
            onClick={submit}
            disabled={submitting}
            className="bg-marina w-full rounded-2xl py-4 text-lg font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "제출 중…" : "제출하기"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- 화면 ---------- */
function Intro({ onPick }: { onPick: (t: SurveyType) => void }) {
  return (
    <div className="mt-8 text-center">
      <h1 className="text-ink text-2xl font-bold">이용 만족도 설문</h1>
      <p className="text-muted mt-3 leading-relaxed">
        일산비치짐을 이용해 주셔서 감사합니다.
        <br />
        1~2분이면 완료됩니다.
      </p>
      <p className="text-ink mt-8 font-medium">오늘 어떤 형태로 이용하셨나요?</p>
      <div className="mt-4 grid gap-3">
        <button
          onClick={() => onPick("facility")}
          className="border-marina text-marina hover:bg-marina-light rounded-2xl border-2 py-5 text-lg font-semibold transition-colors"
        >
          시설만 이용
        </button>
        <button
          onClick={() => onPick("class")}
          className="border-terracotta text-terracotta hover:bg-terracotta/5 rounded-2xl border-2 py-5 text-lg font-semibold transition-colors"
        >
          클래스 참여
        </button>
      </div>
    </div>
  );
}

function Done() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="bg-marina flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white">
        ✓
      </div>
      <h1 className="text-ink mt-6 text-2xl font-bold">소중한 의견 감사합니다</h1>
      <p className="text-muted mt-3">
        더 좋은 일산비치짐을 만드는 데 잘 반영하겠습니다.
      </p>
    </div>
  );
}

/* ---------- 입력 부품 ---------- */
function Q({
  title,
  required,
  hint,
  children,
}: {
  title: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-ink text-lg font-semibold">{title}</h2>
        {required && <span className="text-terracotta text-sm">*</span>}
        {hint && <span className="text-muted text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Single({
  options,
  value,
  onSelect,
}: {
  options: readonly { v: string; label: string }[];
  value?: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onSelect(o.v)}
          className={`rounded-xl border-2 px-4 py-2.5 text-base transition-colors ${
            value === o.v
              ? "border-marina bg-marina-light text-marina font-medium"
              : "border-line text-ink/70"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chips({
  options,
  values,
  onToggle,
}: {
  options: readonly { v: string; label: string }[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o.v);
        return (
          <button
            key={o.v}
            onClick={() => onToggle(o.v)}
            className={`rounded-xl border-2 px-4 py-2.5 text-base transition-colors ${
              on
                ? "border-terracotta bg-terracotta/10 text-terracotta font-medium"
                : "border-line text-ink/70"
            }`}
          >
            {on ? "✓ " : ""}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Stars({
  value,
  onSelect,
}: {
  value?: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onSelect(n)}
          aria-label={`${n}점`}
          className={`text-4xl transition-transform active:scale-95 ${
            value && n <= value ? "text-amber-400" : "text-line"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Scale5({
  value,
  onSelect,
}: {
  value?: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onSelect(n)}
          className={`tnum h-11 flex-1 rounded-lg border-2 text-base font-medium transition-colors ${
            value === n
              ? "border-marina bg-marina text-white"
              : "border-line text-ink/60"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function Scale11({
  value,
  onSelect,
}: {
  value?: number;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1.5">
      {Array.from({ length: 11 }, (_, n) => (
        <button
          key={n}
          onClick={() => onSelect(n)}
          className={`tnum h-11 rounded-lg border-2 text-base font-medium transition-colors ${
            value === n
              ? "border-marina bg-marina text-white"
              : "border-line text-ink/60"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
