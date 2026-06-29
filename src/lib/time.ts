/**
 * KST(Asia/Seoul, UTC+9, DST 없음) 기준 시간 유틸.
 * 서버가 UTC(예: Vercel)에서 돌아도 '오늘/이번주' 계산이 한국 시간 기준이 되도록 함.
 */
import { OPERATION } from "./config";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 주어진 시각(기본: 현재)의 KST 벽시계 구성요소 */
export function kstParts(date: Date = new Date()) {
  const k = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: k.getUTCFullYear(),
    month: k.getUTCMonth() + 1,
    day: k.getUTCDate(),
    hour: k.getUTCHours(),
    minute: k.getUTCMinutes(),
    weekday: k.getUTCDay(), // 0=일 ... 6=토
  };
}

/** KST 벽시계(연,월,일,시,분)를 실제 UTC Date(=절대시각)로 변환 */
function kstWallToUtc(
  y: number,
  m: number,
  d: number,
  hh = 0,
  mm = 0,
  ss = 0,
): Date {
  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss) - KST_OFFSET_MS);
}

/** KST 기준 '오늘'의 운영 시작 시각(절대시각) */
export function operatingDayStart(now: Date = new Date()): Date {
  const p = kstParts(now);
  return kstWallToUtc(p.year, p.month, p.day, OPERATION.open.hour, OPERATION.open.minute);
}

/** KST 기준 '오늘'의 운영 종료 시각(절대시각) */
export function operatingDayEnd(now: Date = new Date()): Date {
  const p = kstParts(now);
  return kstWallToUtc(p.year, p.month, p.day, OPERATION.close.hour, OPERATION.close.minute);
}

/** KST 자정 기준 '오늘'의 시작(00:00) */
export function kstStartOfDay(now: Date = new Date()): Date {
  const p = kstParts(now);
  return kstWallToUtc(p.year, p.month, p.day, 0, 0, 0);
}

/** KST 기준 이번 주(월요일 00:00) 시작 */
export function kstStartOfWeek(now: Date = new Date()): Date {
  const p = kstParts(now);
  const base = kstWallToUtc(p.year, p.month, p.day, 0, 0, 0);
  // weekday: 0=일 → 지난 월요일까지 거슬러 (월=0칸, 일=6칸)
  const back = (p.weekday + 6) % 7;
  return new Date(base.getTime() - back * 24 * 60 * 60 * 1000);
}

/** KST 기준 이번 달 1일 00:00 */
export function kstStartOfMonth(now: Date = new Date()): Date {
  const p = kstParts(now);
  return kstWallToUtc(p.year, p.month, 1, 0, 0, 0);
}

/** 운영 시간 내(09:00~20:00)인지 */
export function isWithinOperatingHours(now: Date = new Date()): boolean {
  return now >= operatingDayStart(now) && now < operatingDayEnd(now);
}

/** 주말 여부(토·일) */
export function isWeekend(now: Date = new Date()): boolean {
  const wd = kstParts(now).weekday;
  return wd === 0 || wd === 6;
}

/** "YYYY-MM-DD" KST 날짜 키 (일자별 집계용) */
export function kstDateKey(date: Date = new Date()): string {
  const p = kstParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** "HH:MM" KST 표기 */
export function fmtKstTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const p = kstParts(d);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** "M/D HH:MM" KST 표기 */
export function fmtKstDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const p = kstParts(d);
  return `${p.month}/${p.day} ${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}
