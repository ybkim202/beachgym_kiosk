"use client";
import { BASE_PATH } from "@/lib/config";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import {
  ONEPICK_EVENTS,
  ONEPICK_DIVISIONS,
  RELAY_DIVISIONS,
  RELAY_STATIONS,
  CHALLENGE_REWARD,
  onepickEvent,
  type ChallengeMode,
} from "@/lib/challenge";

type Step = "mode" | "select" | "run" | "done";

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${m}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function ChallengeApp() {
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<ChallengeMode>("onepick");
  const [event, setEvent] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [participant, setParticipant] = useState("");

  // 타이머
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // 판정
  const [passed, setPassed] = useState<boolean | null>(null);
  const [resultLabel, setResultLabel] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardShown, setRewardShown] = useState<string | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setElapsed(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const relayCutoffMs =
    mode === "relay"
      ? (RELAY_DIVISIONS.find((d) => d.v === division)?.cutoffMin ?? 0) * 60_000
      : 0;

  const reset = () => {
    setStep("mode");
    setMode("onepick");
    setEvent("");
    setDivision("");
    setParticipant("");
    setElapsed(0);
    setRunning(false);
    setPassed(null);
    setResultLabel("");
    setPhoto(null);
    setError(null);
  };

  const canStart =
    participant.trim().length >= 1 &&
    division &&
    (mode === "relay" || event);

  const submit = async () => {
    if (passed === null) {
      setError("성공 / 실패를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("mode", mode);
      fd.set("event", mode === "relay" ? "relay" : event);
      fd.set("division", division);
      fd.set("participant", participant.trim());
      fd.set("passed", String(passed));
      if (resultLabel.trim()) fd.set("resultLabel", resultLabel.trim());
      if (elapsed > 0) fd.set("elapsedMs", String(Math.round(elapsed)));
      if (photo) fd.set("photo", photo);
      const res = await fetch(BASE_PATH + "/api/challenge", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
      setRewardShown(passed ? CHALLENGE_REWARD[mode] : null);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-dvh">
      <div className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-10 pt-8 shadow-sm">
        {/* 헤더 */}
        <div className="flex flex-col items-center">
          <LogoMark size={40} color="var(--marina)" />
          <div className="text-ink mt-2 text-lg font-light tracking-[0.12em]">
            ILSAN BEACH GYM
          </div>
          <div className="text-muted text-sm">챌린지 진행</div>
        </div>

        {/* STEP: 모드 */}
        {step === "mode" && (
          <div className="mt-10 space-y-4">
            <h2 className="text-ink text-center text-2xl font-medium">챌린지 종류</h2>
            <button
              onClick={() => {
                setMode("onepick");
                setStep("select");
              }}
              className="border-line hover:border-marina w-full rounded-2xl border-2 p-6 text-left"
            >
              <div className="text-ink text-xl font-semibold">A. 원픽 챌린지</div>
              <div className="text-muted mt-1 text-sm">8종목 중 1개 · 성공 시 {CHALLENGE_REWARD.onepick}</div>
            </button>
            <button
              onClick={() => {
                setMode("relay");
                setEvent("relay");
                setStep("select");
              }}
              className="border-line hover:border-marina w-full rounded-2xl border-2 p-6 text-left"
            >
              <div className="text-ink text-xl font-semibold">B. 미니 하이록스</div>
              <div className="text-muted mt-1 text-sm">8스테이션 릴레이 · 성공 시 {CHALLENGE_REWARD.relay}</div>
            </button>
            <div className="pt-4 text-center">
              <Link href="/staff" className="text-muted text-sm underline">
                직원 메뉴로
              </Link>
            </div>
          </div>
        )}

        {/* STEP: 선택 + 기준 */}
        {step === "select" && (
          <div className="mt-8 space-y-6">
            {mode === "onepick" && (
              <div>
                <h3 className="text-ink mb-2 font-medium">종목</h3>
                <div className="grid grid-cols-2 gap-2">
                  {ONEPICK_EVENTS.map((e) => (
                    <button
                      key={e.key}
                      onClick={() => setEvent(e.key)}
                      className={`rounded-xl border-2 p-3 text-sm ${
                        event === e.key
                          ? "border-marina text-marina font-semibold"
                          : "border-line text-ink"
                      }`}
                    >
                      {e.ko}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-ink mb-2 font-medium">부문</h3>
              <div className="flex flex-wrap gap-2">
                {(mode === "onepick" ? ONEPICK_DIVISIONS : RELAY_DIVISIONS).map((d) => (
                  <button
                    key={d.v}
                    onClick={() => setDivision(d.v)}
                    className={`rounded-full border-2 px-4 py-2 text-sm ${
                      division === d.v
                        ? "border-marina text-marina font-semibold"
                        : "border-line text-ink"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 기준 표시 */}
            {mode === "onepick" && event && division && (
              <div className="bg-surface rounded-2xl p-4">
                <div className="text-muted text-xs">기준 · {onepickEvent(event)?.ko}</div>
                <div className="text-ink mt-1 text-lg font-semibold">
                  {onepickEvent(event)?.target[division as "male" | "female_youth"]}
                </div>
              </div>
            )}
            {mode === "relay" && division && (
              <div className="bg-surface rounded-2xl p-4">
                <div className="text-muted text-xs">
                  기준 · {RELAY_DIVISIONS.find((d) => d.v === division)?.label} · 컷오프{" "}
                  {RELAY_DIVISIONS.find((d) => d.v === division)?.cutoffMin}분
                </div>
                <ol className="text-ink mt-2 list-decimal space-y-0.5 pl-5 text-sm">
                  {RELAY_STATIONS.map((s) => (
                    <li key={s.ko}>
                      {s.ko} {s.male}
                    </li>
                  ))}
                </ol>
                <div className="text-muted mt-1 text-xs">
                  ※ 여성·청소년: 스키·로잉 200m, 월볼 15개, 파머스 30m
                </div>
              </div>
            )}

            <div>
              <h3 className="text-ink mb-2 font-medium">
                {mode === "relay" ? "팀명 / 닉네임" : "닉네임"}
              </h3>
              <input
                value={participant}
                onChange={(e) => setParticipant(e.target.value)}
                placeholder="보드에 표시됩니다"
                className="border-line focus:border-marina w-full rounded-xl border-2 px-4 py-3 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("mode")}
                className="border-line text-ink rounded-xl border-2 px-5 py-3"
              >
                이전
              </button>
              <button
                disabled={!canStart}
                onClick={() => {
                  setElapsed(0);
                  setStep("run");
                }}
                className="bg-marina flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-40"
              >
                시작
              </button>
            </div>
          </div>
        )}

        {/* STEP: 타이머 + 판정 */}
        {step === "run" && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <div className="text-muted text-sm">{participant}</div>
              <div
                className={`mt-2 font-mono text-6xl font-bold tabular-nums ${
                  mode === "relay" && elapsed > relayCutoffMs ? "text-point" : "text-ink"
                }`}
              >
                {fmt(elapsed)}
              </div>
              {mode === "relay" && (
                <div className="text-muted mt-1 text-sm">
                  컷오프 {RELAY_DIVISIONS.find((d) => d.v === division)?.cutoffMin}분
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3">
              {!running ? (
                <button
                  onClick={() => {
                    startRef.current = Date.now() - elapsed;
                    setRunning(true);
                  }}
                  className="bg-marina rounded-full px-8 py-3 font-semibold text-white"
                >
                  {elapsed > 0 ? "재개" : "타이머 시작"}
                </button>
              ) : (
                <button
                  onClick={() => setRunning(false)}
                  className="border-line text-ink rounded-full border-2 px-8 py-3 font-semibold"
                >
                  정지
                </button>
              )}
              {elapsed > 0 && !running && (
                <button
                  onClick={() => setElapsed(0)}
                  className="text-muted px-4 text-sm underline"
                >
                  리셋
                </button>
              )}
            </div>

            {/* 판정 */}
            <div className="border-line space-y-4 rounded-2xl border-2 p-4">
              <div>
                <h3 className="text-ink mb-2 font-medium">판정</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPassed(true)}
                    className={`flex-1 rounded-xl border-2 py-3 font-semibold ${
                      passed === true ? "border-marina text-marina" : "border-line text-ink"
                    }`}
                  >
                    성공
                  </button>
                  <button
                    onClick={() => setPassed(false)}
                    className={`flex-1 rounded-xl border-2 py-3 font-semibold ${
                      passed === false ? "border-point text-point" : "border-line text-ink"
                    }`}
                  >
                    실패
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-ink mb-1 font-medium text-sm">기록 (선택)</h3>
                <input
                  value={resultLabel}
                  onChange={(e) => setResultLabel(e.target.value)}
                  placeholder="예) 260m, 9분 40초"
                  className="border-line focus:border-marina w-full rounded-xl border-2 px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <h3 className="text-ink mb-1 text-sm font-medium">인증사진</h3>
                <label
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 font-semibold active:scale-[0.99] ${
                    photo ? "border-marina text-marina" : "border-marina/60 text-marina"
                  }`}
                >
                  <span className="text-2xl">📷</span>
                  {photo ? "사진 다시 촬영 / 선택" : "사진 촬영 / 선택"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
                {photo && (
                  <div className="text-marina mt-2 flex items-center gap-1 text-xs">
                    <span>✓ 첨부됨</span>
                    <span className="text-muted truncate">· {photo.name}</span>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-point text-sm">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRunning(false);
                  setStep("select");
                }}
                className="border-line text-ink rounded-xl border-2 px-5 py-3"
              >
                이전
              </button>
              <button
                disabled={submitting}
                onClick={submit}
                className="bg-marina flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-40"
              >
                {submitting ? "등록 중…" : "결과 등록"}
              </button>
            </div>
          </div>
        )}

        {/* STEP: 완료 */}
        {step === "done" && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="bg-marina flex h-20 w-20 items-center justify-center rounded-full text-3xl text-white">
              ✓
            </div>
            <h2 className="text-ink mt-6 text-2xl font-medium">결과가 등록되었습니다</h2>
            {rewardShown ? (
              <p className="text-muted mt-2">
                성공! <b className="text-marina">{rewardShown}</b> 증정 (1인 1일 1회)
              </p>
            ) : (
              <p className="text-muted mt-2">기록이 보드에 반영됩니다</p>
            )}
            <button
              onClick={reset}
              className="bg-marina mt-10 rounded-xl px-8 py-3 font-semibold text-white"
            >
              새 챌린지
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
