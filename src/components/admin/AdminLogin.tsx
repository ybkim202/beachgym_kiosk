"use client";
import { BASE_PATH } from "@/lib/config";

import { useState } from "react";
import { LogoMark } from "@/components/Logo";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(BASE_PATH + "/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "로그인 실패");
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("네트워크 오류");
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface flex min-h-dvh items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col items-center">
          <LogoMark size={52} color="var(--marina)" />
          <h1 className="text-ink mt-4 text-xl font-light tracking-[0.12em]">
            ILSAN BEACH GYM
          </h1>
          <p className="text-muted mt-1 text-sm">관리자 대시보드</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="관리자 비밀번호"
          autoFocus
          className="mt-6 w-full rounded-xl border-2 border-line px-4 py-3 text-lg focus:border-marina focus:outline-none"
        />
        {error && <p className="text-terracotta mt-2 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-marina mt-4 w-full rounded-xl py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          {loading ? "확인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
