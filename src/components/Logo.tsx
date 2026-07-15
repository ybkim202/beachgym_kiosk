/** ILSAN BEACH GYM 심볼(메달리온) — 운영계획서 로고를 단순화한 기하 버전 */
export function LogoMark({
  size = 88,
  color = "currentColor",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  // 8방향 방사형 페탈 메달리온
  const petals = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="ILSAN BEACH GYM"
    >
      <g fill={color}>
        {petals.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
            <path d="M50 12 q7 0 9 8 l-9 9 -9 -9 q2 -8 9 -8 Z" />
          </g>
        ))}
        <circle cx="50" cy="50" r="7" />
      </g>
    </svg>
  );
}

/** 워드마크 포함 풀 로고 (세로형) */
export function LogoFull({
  className,
  markColor = "var(--ink)",
}: {
  className?: string;
  markColor?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className ?? ""}`}>
      <LogoMark size={72} color={markColor} className="md:h-24 md:w-24" />
      <div className="mt-5 text-center">
        <div className="text-ink text-2xl font-light tracking-[0.12em] md:text-4xl md:tracking-[0.18em]">
          ILSAN BEACH GYM
        </div>
        <div className="text-muted mt-2 text-sm tracking-[0.3em] md:text-base md:tracking-[0.5em]">
          해 파 랑 길 · 울 산 동 구
        </div>
      </div>
    </div>
  );
}
