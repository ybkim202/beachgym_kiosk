"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QR({
  value,
  size = 160,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value, size]);

  // 아직 생성 전이면 같은 크기의 자리표시자를 렌더(빈 src 경고 방지)
  if (!url) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, background: "#f1f3f5", borderRadius: 8 }}
        aria-label="QR 생성 중"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt="QR"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
