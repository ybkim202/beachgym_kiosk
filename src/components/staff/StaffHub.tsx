"use client";
import { BASE_PATH } from "@/lib/config";
import { compressImage } from "@/lib/image";

import { useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";

interface Cat {
  key: string;
  label: string;
}
type Mode = "home" | "checkin" | "task" | "photo" | "checkout";

export function StaffHub({
  taskCategories,
  photoCategories,
  checkoutPhotos,
}: {
  taskCategories: Cat[];
  photoCategories: Cat[];
  checkoutPhotos: Cat[];
}) {
  const [mode, setMode] = useState<Mode>("home");
  const [done, setDone] = useState<string | null>(null);

  const finish = (label: string) => {
    setDone(label);
    setMode("home");
  };

  return (
    <div className="bg-surface min-h-dvh">
      <div className="mx-auto min-h-dvh max-w-lg bg-white px-5 pb-10 pt-8 shadow-sm">
        <div className="flex flex-col items-center">
          <LogoMark size={40} color="var(--marina)" />
          <div className="text-ink mt-2 text-lg font-light tracking-[0.12em]">
            ILSAN BEACH GYM
          </div>
          <div className="text-muted text-sm">직원 업무 기록</div>
        </div>

        {done && mode === "home" && (
          <div className="bg-marina-light text-marina mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
            ✓ {done} 등록 완료
          </div>
        )}

        {mode === "home" && (
          <div className="mt-8 grid gap-4">
            <Tile
              color="var(--marina)"
              emoji="🏖️"
              title="출근 등록"
              desc="이름 + 출근 확인 사진(본인 + 비치짐)"
              onClick={() => {
                setDone(null);
                setMode("checkin");
              }}
            />
            <Tile
              color="#1f2d3a"
              emoji="🧹"
              title="업무 기록"
              desc="시설 청소 · 운동기구 정리 · 안전시설 점검"
              onClick={() => {
                setDone(null);
                setMode("task");
              }}
            />
            <Tile
              color="#3f8f6f"
              emoji="📸"
              title="현황 사진"
              desc="수시로 현황·청소·정리 사진 업로드"
              onClick={() => {
                setDone(null);
                setMode("photo");
              }}
            />
            <Tile
              color="var(--terracotta)"
              emoji="🔒"
              title="퇴근 등록"
              desc="청소·정리·진입금지 줄 사진 후 퇴근"
              onClick={() => {
                setDone(null);
                setMode("checkout");
              }}
            />
            <Link
              href="/challenge"
              className="flex items-center gap-4 rounded-2xl border border-line p-5 text-left transition-colors active:scale-[0.99]"
            >
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: "#c85840", color: "white" }}
              >
                🏆
              </span>
              <span>
                <span className="text-ink block font-medium">챌린지 진행</span>
                <span className="text-muted block text-sm">원픽 · 미니 하이록스 · 결과 보드 등록</span>
              </span>
            </Link>
            <Link
              href="/admin/staff"
              className="text-muted mt-2 text-center text-sm underline"
            >
              관리자에서 기록 보기
            </Link>
          </div>
        )}

        {mode === "checkin" && (
          <CheckinForm onBack={() => setMode("home")} onDone={() => finish("출근")} />
        )}
        {mode === "task" && (
          <CategoryPhotoForm
            kind="task"
            heading="업무 기록"
            categories={taskCategories}
            onBack={() => setMode("home")}
            onDone={() => finish("업무")}
          />
        )}
        {mode === "photo" && (
          <CategoryPhotoForm
            kind="photo"
            heading="현황 사진"
            categories={photoCategories}
            onBack={() => setMode("home")}
            onDone={() => finish("현황 사진")}
          />
        )}
        {mode === "checkout" && (
          <CheckoutForm
            photos={checkoutPhotos}
            onBack={() => setMode("home")}
            onDone={() => finish("퇴근")}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- 홈 타일 ---------- */
function Tile({
  color,
  emoji,
  title,
  desc,
  onClick,
}: {
  color: string;
  emoji: string;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-line p-5 text-left transition-colors active:scale-[0.99]"
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
        style={{ backgroundColor: color, color: "white" }}
      >
        {emoji}
      </span>
      <span className="flex-1">
        <span className="text-ink block text-lg font-bold">{title}</span>
        <span className="text-muted block text-sm">{desc}</span>
      </span>
      <span className="text-line text-2xl">›</span>
    </button>
  );
}

/* ---------- 사진 촬영 입력 ---------- */
function PhotoCapture({
  label,
  hint,
  file,
  onPick,
}: {
  label: string;
  hint?: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div>
      <div className="text-ink/80 mb-2 text-sm font-medium">
        {label}
        {hint && <span className="text-muted ml-2 text-xs">{hint}</span>}
      </div>
      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="h-48 w-full rounded-xl object-cover" />
          <button
            onClick={() => onPick(null)}
            className="bg-ink/70 absolute right-2 top-2 rounded-full px-3 py-1 text-sm text-white"
          >
            다시 촬영
          </button>
        </div>
      ) : (
        <label className="bg-marina-light text-marina flex h-32 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-marina/40 font-medium">
          📷 사진 촬영 / 첨부
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

function FormShell({
  heading,
  onBack,
  children,
  onSubmit,
  submitting,
  error,
  submitLabel,
  canSubmit,
}: {
  heading: string;
  onBack: () => void;
  children: React.ReactNode;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  canSubmit: boolean;
}) {
  return (
    <div className="mt-6">
      <button onClick={onBack} className="text-muted mb-4 text-sm">
        ← 뒤로
      </button>
      <h2 className="text-ink text-xl font-bold">{heading}</h2>
      {error && (
        <div className="bg-terracotta/10 text-terracotta mt-4 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="mt-5 space-y-5">{children}</div>
      <button
        onClick={onSubmit}
        disabled={submitting || !canSubmit}
        className="bg-marina mt-7 w-full rounded-2xl py-4 text-lg font-semibold text-white disabled:opacity-40"
      >
        {submitting ? "제출 중…" : submitLabel}
      </button>
    </div>
  );
}

async function postEvent(fd: FormData): Promise<string | null> {
  const res = await fetch(BASE_PATH + "/api/staff/event", { method: "POST", body: fd });
  if (res.status === 401) {
    window.location.reload();
    return "재로그인이 필요합니다.";
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) return json.error || "제출 중 오류가 발생했어요.";
  return null;
}

/* ---------- 출근 ---------- */
function CheckinForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError("이름을 입력해주세요.");
    if (!file) return setError("출근 확인 사진을 촬영해주세요.");
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("kind", "checkin");
    fd.set("staffName", name);
    fd.set("title", "출근");
    fd.set("photoCount", "1");
    fd.set("photo_0", await compressImage(file));
    fd.set("label_0", "출근 확인");
    const err = await postEvent(fd);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    onDone();
  };

  return (
    <FormShell
      heading="출근 등록"
      onBack={onBack}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      submitLabel="출근 등록"
      canSubmit={!!name.trim() && !!file}
    >
      <div>
        <label className="text-ink/80 mb-2 block text-sm font-medium">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="직원 이름"
          className="w-full rounded-xl border-2 border-line p-3 text-base focus:border-marina focus:outline-none"
        />
      </div>
      <PhotoCapture
        label="출근 확인 사진"
        hint="본인 + 비치짐이 나오게 · 가로로"
        file={file}
        onPick={setFile}
      />
    </FormShell>
  );
}

/* ---------- 업무 기록 / 현황 사진 (카테고리 + 사진 1장) ---------- */
function CategoryPhotoForm({
  kind,
  heading,
  categories,
  onBack,
  onDone,
}: {
  kind: "task" | "photo";
  heading: string;
  categories: Cat[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [cat, setCat] = useState<Cat | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!cat) return setError("종류를 선택해주세요.");
    if (!file) return setError("사진을 촬영해주세요.");
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("title", cat.label);
    fd.set("category", cat.key);
    fd.set("memo", memo);
    fd.set("photoCount", "1");
    fd.set("photo_0", await compressImage(file));
    fd.set("label_0", cat.label);
    const err = await postEvent(fd);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    onDone();
  };

  return (
    <FormShell
      heading={heading}
      onBack={onBack}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      submitLabel="등록"
      canSubmit={!!cat && !!file}
    >
      <div>
        <label className="text-ink/80 mb-2 block text-sm font-medium">종류</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c)}
              className={`rounded-xl border-2 px-4 py-2.5 text-base transition-colors ${
                cat?.key === c.key
                  ? "border-marina bg-marina-light text-marina font-medium"
                  : "border-line text-ink/70"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <PhotoCapture label="사진" file={file} onPick={setFile} />
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="메모 (선택)"
        className="w-full rounded-xl border-2 border-line p-3 text-sm focus:border-marina focus:outline-none"
      />
    </FormShell>
  );
}

/* ---------- 퇴근 (필수 사진 여러 장) ---------- */
function CheckoutForm({
  photos,
  onBack,
  onDone,
}: {
  photos: Cat[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPicked = photos.every((p) => files[p.key]);

  const submit = async () => {
    if (!allPicked)
      return setError("퇴근 사진(청소·정리·진입금지 줄)을 모두 촬영해주세요.");
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("kind", "checkout");
    fd.set("staffName", name);
    fd.set("title", "퇴근");
    fd.set("memo", memo);
    fd.set("photoCount", String(photos.length));
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      fd.set(`photo_${i}`, await compressImage(files[p.key] as File));
      fd.set(`label_${i}`, p.label);
    }
    const err = await postEvent(fd);
    if (err) {
      setError(err);
      setSubmitting(false);
      return;
    }
    onDone();
  };

  return (
    <FormShell
      heading="퇴근 등록"
      onBack={onBack}
      onSubmit={submit}
      submitting={submitting}
      error={error}
      submitLabel="퇴근 등록"
      canSubmit={allPicked}
    >
      <div>
        <label className="text-ink/80 mb-2 block text-sm font-medium">
          이름 <span className="text-muted text-xs">(선택)</span>
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="직원 이름"
          className="w-full rounded-xl border-2 border-line p-3 text-base focus:border-marina focus:outline-none"
        />
      </div>
      {photos.map((p) => (
        <PhotoCapture
          key={p.key}
          label={p.label}
          file={files[p.key] ?? null}
          onPick={(f) => setFiles((s) => ({ ...s, [p.key]: f }))}
        />
      ))}
      <input
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="특이사항 (선택)"
        className="w-full rounded-xl border-2 border-line p-3 text-sm focus:border-marina focus:outline-none"
      />
    </FormShell>
  );
}
