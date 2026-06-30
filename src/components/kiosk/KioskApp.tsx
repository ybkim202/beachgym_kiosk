"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogoFull, LogoMark } from "@/components/Logo";
import { t } from "@/lib/i18n";
import { LINKS, OPERATION, BASE_PATH } from "@/lib/config";
import type { AgeGroup, Gender, Language, Region } from "@/lib/types";
import { SignaturePad } from "./SignaturePad";
import { QR } from "./QR";

type Phase = "idle" | "lang" | "agree" | "info" | "guide" | "done";

const STEP_ORDER: Phase[] = ["lang", "agree", "info", "guide", "done"];
const INACTIVITY_MS = 90_000; // 90초 무동작 시 처음 화면으로
const DONE_RETURN_S = 30; // 완료 후 자동 복귀 카운트다운

interface FormState {
  language: Language;
  agreed: boolean;
  signed: boolean;
  name: string;
  phone: string;
  partySize: number;
  ageGroup?: AgeGroup;
  gender?: Gender;
  region?: Region;
}

const EMPTY: FormState = {
  language: "ko",
  agreed: false,
  signed: false,
  name: "",
  phone: "",
  partySize: 1,
};

export function KioskApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [clearSign, setClearSign] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyOk, setNotifyOk] = useState(true);

  const lang = form.language;
  const T = t(lang);

  const set = useCallback(
    <K extends keyof FormState>(k: K, v: FormState[K]) =>
      setForm((f) => ({ ...f, [k]: v })),
    [],
  );

  // 동반 인원 ±1 (함수형 업데이트 — 빠른 연속 탭에도 정확)
  const adjustParty = useCallback(
    (delta: number) =>
      setForm((f) => ({
        ...f,
        partySize: Math.min(20, Math.max(1, f.partySize + delta)),
      })),
    [],
  );

  const reset = useCallback(() => {
    setForm(EMPTY);
    setError(null);
    setSubmitting(false);
    setNotifyOk(true);
    setClearSign((n) => n + 1);
    setPhase("idle");
  }, []);

  // ---- 무동작 자동 복귀 ----
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bump = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (phase === "idle" || phase === "done") return;
    idleTimer.current = setTimeout(reset, INACTIVITY_MS);
  }, [phase, reset]);

  useEffect(() => {
    bump();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [phase, bump]);

  // ---- 완료 후 자동 복귀 카운트다운 ----
  const [countdown, setCountdown] = useState(DONE_RETURN_S);
  useEffect(() => {
    if (phase !== "done") return;
    setCountdown(DONE_RETURN_S);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          reset();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, reset]);

  // ---- 제출 ----
  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          partySize: form.partySize,
          ageGroup: form.ageGroup,
          gender: form.gender,
          region: form.region,
          language: form.language,
          agreed: form.agreed,
          signedName: form.name,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || T.submitFail);
        setSubmitting(false);
        return;
      }
      setNotifyOk(Boolean(json.notify?.ok));
      setPhase("done");
    } catch {
      setError(T.submitFail);
    } finally {
      setSubmitting(false);
    }
  }, [form, T]);

  const stepIndex = STEP_ORDER.indexOf(phase);

  return (
    <div
      className="kiosk-root bg-surface relative h-dvh w-screen overflow-hidden"
      onPointerDown={bump}
    >
      {phase === "idle" ? (
        <Attract onStart={() => setPhase("lang")} lang={lang} />
      ) : (
        <div className="animate-step-in flex h-full flex-col">
          <KioskHeader
            current={stepIndex}
            lang={lang}
            onHome={reset}
            hideStepper={phase === "done"}
          />

          <main className="min-h-0 flex-1 px-[6vw] pb-6">
            {phase === "lang" && (
              <LanguageStep
                onSelect={(l) => {
                  set("language", l);
                  setPhase("agree");
                }}
              />
            )}
            {phase === "agree" && (
              <AgreementStep
                lang={lang}
                agreed={form.agreed}
                signed={form.signed}
                clearSign={clearSign}
                onAgree={(v) => set("agreed", v)}
                onSignChange={(v) => set("signed", v)}
                onClear={() => {
                  setClearSign((n) => n + 1);
                  set("signed", false);
                }}
                onBack={() => setPhase("lang")}
                onNext={() => setPhase("info")}
              />
            )}
            {phase === "info" && (
              <InfoStep
                lang={lang}
                form={form}
                set={set}
                adjustParty={adjustParty}
                onBack={() => setPhase("agree")}
                onNext={() => setPhase("guide")}
              />
            )}
            {phase === "guide" && (
              <GuideStep
                lang={lang}
                submitting={submitting}
                error={error}
                onBack={() => setPhase("info")}
                onSubmit={submit}
              />
            )}
            {phase === "done" && (
              <DoneStep
                lang={lang}
                notifyOk={notifyOk}
                countdown={countdown}
                onFinish={reset}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

/* ============================ Attract ============================ */
/** 사용자 제스처(터치)에서 전체화면 진입 — 브라우저 주소창·탭 숨김 */
function enterFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
  };
  try {
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch {
    /* 일부 브라우저/권한에서 무시 */
  }
}

function Attract({ onStart, lang }: { onStart: () => void; lang: Language }) {
  const T = t(lang);
  return (
    <button
      onClick={() => {
        enterFullscreen();
        onStart();
      }}
      className="from-marina-light flex h-full w-full flex-col items-center justify-center bg-gradient-to-b to-white"
    >
      <LogoFull />
      <div className="mt-16 flex flex-col items-center gap-3">
        <span className="bg-marina/10 text-marina inline-flex h-3 w-3 animate-ping rounded-full" />
        <p className="text-marina animate-pulse text-2xl font-medium tracking-wide">
          {T.touchToStart}
        </p>
      </div>
      <p className="text-muted absolute bottom-8 text-sm tracking-widest">
        해파랑 웰니스파크 · The Deck · {OPERATION.feeLabel}
      </p>
    </button>
  );
}

/* ============================ Header / Stepper ============================ */
function KioskHeader({
  current,
  lang,
  onHome,
  hideStepper,
}: {
  current: number;
  lang: Language;
  onHome: () => void;
  hideStepper: boolean;
}) {
  const T = t(lang);
  const labels = [T.stepLanguage, T.stepAgreement, T.stepInfo, T.stepGuide, T.stepDone];
  return (
    <header className="flex items-center justify-between px-[6vw] pb-4 pt-6">
      <button onClick={onHome} className="flex items-center gap-3">
        <LogoMark size={34} color="var(--marina)" />
        <span className="text-ink text-lg font-light tracking-[0.15em]">
          ILSAN BEACH GYM
        </span>
      </button>
      {!hideStepper && (
        <div className="flex items-center gap-2">
          {labels.slice(0, 4).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors ${
                  i === current
                    ? "bg-marina text-white"
                    : i < current
                      ? "bg-marina/15 text-marina"
                      : "text-muted bg-black/5"
                }`}
              >
                <span className="tnum font-semibold">{i + 1}</span>
                <span className="hidden md:inline">{label}</span>
              </div>
              {i < 3 && <span className="text-line">›</span>}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

/* ============================ Step 1: Language ============================ */
function LanguageStep({ onSelect }: { onSelect: (l: Language) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-ink text-4xl font-light">언어를 선택하세요</h1>
      <p className="text-muted mt-2 text-xl">Select your language</p>
      <div className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-8">
        <LangCard
          title="한국어"
          sub="내국인 · Korean"
          onClick={() => onSelect("ko")}
        />
        <LangCard
          title="English"
          sub="외국인 · Foreigner"
          onClick={() => onSelect("en")}
        />
      </div>
    </div>
  );
}

function LangCard({
  title,
  sub,
  onClick,
}: {
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hover:border-marina group flex flex-col items-center gap-4 rounded-3xl border-2 border-line bg-white p-12 transition-all active:scale-[0.98]"
    >
      <span className="text-ink text-3xl font-medium">{title}</span>
      <span className="text-muted text-lg">{sub}</span>
    </button>
  );
}

/* ============================ Step 2: Agreement ============================ */
function AgreementStep({
  lang,
  agreed,
  signed,
  clearSign,
  onAgree,
  onSignChange,
  onClear,
  onBack,
  onNext,
}: {
  lang: Language;
  agreed: boolean;
  signed: boolean;
  clearSign: number;
  onAgree: (v: boolean) => void;
  onSignChange: (v: boolean) => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const T = t(lang);
  const canNext = agreed && signed;
  return (
    <div className="flex h-full flex-col">
      <StepTitle title={T.agreeTitle} sub={T.agreeSub} />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
        {/* 수칙 */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-line bg-white p-6">
          <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {T.agreeItems.map((item, i) => (
              <li key={i} className="flex gap-3 text-[17px] leading-relaxed">
                <span className="text-marina mt-0.5 font-bold">{i + 1}</span>
                <span className="text-ink/85">{item}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onAgree(!agreed)}
            className={`mt-4 flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
              agreed ? "border-marina bg-marina-light" : "border-line bg-white"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
                agreed ? "border-marina bg-marina text-white" : "border-muted"
              }`}
            >
              {agreed && "✓"}
            </span>
            <span className="text-ink font-medium">{T.agreeCheck}</span>
          </button>
        </div>
        {/* 서명 */}
        <div className="flex min-h-0 flex-col rounded-2xl border border-line bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-ink font-medium">{T.signHere}</span>
            <button
              onClick={onClear}
              className="text-muted rounded-lg border border-line px-3 py-1.5 text-sm"
            >
              {T.clearSign}
            </button>
          </div>
          <div className="min-h-0 flex-1 rounded-2xl border-2 border-dashed border-line">
            <SignaturePad clearSignal={clearSign} onChange={onSignChange} />
          </div>
          {!signed && (
            <p className="text-terracotta mt-2 text-sm">* {T.signRequired}</p>
          )}
        </div>
      </div>
      <NavBar
        lang={lang}
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!canNext}
      />
    </div>
  );
}

/* ============================ Step 3: Info ============================ */
function InfoStep({
  lang,
  form,
  set,
  adjustParty,
  onBack,
  onNext,
}: {
  lang: Language;
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  adjustParty: (delta: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const T = t(lang);
  const [touched, setTouched] = useState(false);
  const phoneDigits = form.phone.replace(/[^0-9]/g, "");
  const nameOk = form.name.trim().length >= 1;
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 11;
  const ageOk = !!form.ageGroup;
  const genderOk = !!form.gender;
  const regionOk = !!form.region;
  const canNext = nameOk && phoneOk && ageOk && genderOk && regionOk;

  const genders: { v: Gender; label: string }[] = [
    { v: "male", label: T.male },
    { v: "female", label: T.female },
    { v: "other", label: T.other },
  ];

  return (
    <div className="flex h-full flex-col">
      <StepTitle title={T.infoTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-x-8 gap-y-5">
          <Field label={T.name} required error={touched && !nameOk ? T.errName : undefined}>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={T.namePh}
              className="kiosk-input"
              autoComplete="off"
            />
          </Field>
          <Field
            label={T.phone}
            required
            error={touched && !phoneOk ? T.errPhone : undefined}
          >
            <input
              value={form.phone}
              onChange={(e) =>
                set("phone", e.target.value.replace(/[^0-9]/g, "").slice(0, 11))
              }
              placeholder={T.phonePh}
              inputMode="numeric"
              className="kiosk-input tnum"
              autoComplete="off"
            />
          </Field>

          <div className="col-span-2">
            <Field label={T.partySize} required>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted text-base">{T.partyHint}</span>
                <NumberStepper
                  value={form.partySize}
                  min={1}
                  max={20}
                  unit={T.people}
                  onInc={() => adjustParty(1)}
                  onDec={() => adjustParty(-1)}
                />
              </div>
            </Field>
          </div>

          <div className="col-span-2">
            <Field
              label={T.ageGroup}
              required
              error={touched && !ageOk ? T.errAge : undefined}
            >
              <ChoiceGroup
                options={T.ageGroups}
                value={form.ageGroup}
                onSelect={(v) => set("ageGroup", v as AgeGroup)}
              />
            </Field>
          </div>

          <Field
            label={T.gender}
            required
            error={touched && !genderOk ? T.errGender : undefined}
          >
            <div className="flex gap-3">
              {genders.map((g) => (
                <button
                  key={g.v}
                  onClick={() => set("gender", g.v)}
                  className={`flex-1 rounded-xl border-2 py-3 text-lg transition-colors ${
                    form.gender === g.v
                      ? "border-marina bg-marina-light text-marina font-medium"
                      : "border-line text-ink/70"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="col-span-2">
            <Field
              label={T.region}
              required
              error={touched && !regionOk ? T.errRegion : undefined}
            >
              <ChoiceGroup
                options={T.regions}
                value={form.region}
                onSelect={(v) => set("region", v as Region)}
                cols={3}
              />
            </Field>
          </div>
        </div>
      </div>
      <NavBar
        lang={lang}
        onBack={onBack}
        onNext={() => {
          setTouched(true);
          if (canNext) onNext();
        }}
        nextDisabled={!canNext}
      />
    </div>
  );
}

/** 숫자 스테퍼 (패드용 +/− 버튼) */
function NumberStepper({
  value,
  min,
  max,
  unit,
  onInc,
  onDec,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  onInc: () => void;
  onDec: () => void;
}) {
  const btn =
    "flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-3xl font-light transition-colors active:scale-95 disabled:opacity-30";
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onDec}
        disabled={value <= min}
        aria-label="인원 감소"
        className={`${btn} border-line text-ink`}
      >
        −
      </button>
      <div className="flex min-w-[88px] items-baseline justify-center gap-1">
        <span className="text-ink tnum text-4xl font-bold">{value}</span>
        {unit && <span className="text-muted text-lg">{unit}</span>}
      </div>
      <button
        type="button"
        onClick={onInc}
        disabled={value >= max}
        aria-label="인원 증가"
        className={`${btn} border-marina text-marina`}
      >
        +
      </button>
    </div>
  );
}

/** 선택형 버튼 그룹 (연령대·지역 공용) */
function ChoiceGroup({
  options,
  value,
  onSelect,
  cols,
}: {
  options: readonly { v: string; label: string }[];
  value: string | undefined;
  onSelect: (v: string) => void;
  cols?: number;
}) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onSelect(o.v)}
          className={`rounded-xl border-2 py-3 text-lg transition-colors ${
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

/* ============================ Step 4: Guide ============================ */
function GuideStep({
  lang,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  lang: Language;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const T = t(lang);
  return (
    <div className="flex h-full flex-col">
      <StepTitle title={T.guideTitle} />
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-5">
        {/* 운영 시간 */}
        <GuideCard title={T.guideHours} accent>
          <p className="text-marina text-3xl font-bold">{T.guideHoursVal}</p>
        </GuideCard>
        {/* 챌린지 운영 시간 */}
        <GuideCard title={T.challengeHours} accent>
          <div className="space-y-1.5">
            <p className="text-ink text-2xl font-semibold">{T.challengeWeekday}</p>
            <p className="text-ink text-2xl font-semibold">{T.challengeWeekend}</p>
          </div>
        </GuideCard>
        {/* 짐 보관 안내 */}
        <GuideCard title={T.storageTitle}>
          <p className="text-ink/85 text-lg leading-relaxed">{T.storageBody}</p>
        </GuideCard>
        {/* 비치짐 이용 방법 */}
        <GuideCard title={T.usageTitle}>
          <p className="text-ink/85 text-lg leading-relaxed">{T.usageBody}</p>
        </GuideCard>
      </div>
      {error && <p className="text-terracotta mt-3 text-center">{error}</p>}
      <NavBar
        lang={lang}
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={submitting ? T.submitting : T.enterGym}
        nextDisabled={submitting}
        accent
      />
    </div>
  );
}

/** 이용 안내 카드 */
function GuideCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex min-h-0 flex-col rounded-2xl border p-6 ${
        accent ? "border-marina/30 bg-marina-light" : "border-line bg-white"
      }`}
    >
      <h3 className="text-marina mb-3 text-lg font-bold">{title}</h3>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

/* ============================ Step 5: Done ============================ */
function DoneStep({
  lang,
  notifyOk,
  countdown,
  onFinish,
}: {
  lang: Language;
  notifyOk: boolean;
  countdown: number;
  onFinish: () => void;
}) {
  const T = t(lang);
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="bg-marina flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white">
        ✓
      </div>
      <h1 className="text-ink mt-5 text-4xl font-light">{T.doneTitle}</h1>
      <p className="text-muted mt-3 text-xl">
        {notifyOk ? T.doneSub : T.doneSubFail}
      </p>

      {/* 클래스 예약 안내 + QR */}
      <div className="border-terracotta/30 bg-terracotta/5 mt-8 flex items-center gap-7 rounded-3xl border p-7">
        <div className="rounded-2xl bg-white p-3">
          <QR value={LINKS.reservation} size={150} />
        </div>
        <div className="max-w-xs text-left">
          <p className="text-terracotta text-2xl font-bold">{T.classBookTitle}</p>
          <p className="text-ink/80 mt-2 whitespace-pre-line text-lg leading-relaxed">
            {T.classBookBody}
          </p>
          <p className="text-muted mt-2 break-all text-sm">{LINKS.reservation}</p>
        </div>
      </div>

      <button
        onClick={onFinish}
        className="text-muted mt-10 rounded-full border border-line px-8 py-3"
      >
        {T.finishNow} · {countdown}
        {lang === "ko" ? "초" : "s"} {T.autoReturn}
      </button>
    </div>
  );
}

/* ============================ Shared bits ============================ */
function StepTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="py-4">
      <h2 className="text-ink text-3xl font-light">{title}</h2>
      {sub && <p className="text-muted mt-1 text-lg">{sub}</p>}
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-ink/70 mb-2 flex items-center gap-2 text-base font-medium">
        {label}
        {required && <span className="text-terracotta text-sm">*</span>}
        {optional && <span className="text-muted text-xs">(선택)</span>}
      </span>
      {children}
      {error && <span className="text-terracotta mt-1 block text-sm">{error}</span>}
    </label>
  );
}

function NavBar({
  lang,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  accent,
}: {
  lang: Language;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  accent?: boolean;
}) {
  const T = t(lang);
  return (
    <div className="flex items-center justify-between pt-5">
      <button
        onClick={onBack}
        className="text-ink/70 rounded-2xl border-2 border-line bg-white px-10 py-4 text-lg font-medium active:scale-[0.98]"
      >
        ← {T.back}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`rounded-2xl px-14 py-4 text-lg font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
          accent ? "bg-terracotta" : "bg-marina"
        }`}
      >
        {nextLabel ?? T.next} →
      </button>
    </div>
  );
}
