"use client";

import type { DayForecast } from "@/lib/types";
import WeatherIcon from "./WeatherIcon";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-09-02" -> Date（UTC 固定で扱うのでタイムゾーンでずれない） */
function toDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

type Props = {
  days: DayForecast[];
  selected: string;
  onSelect: (date: string) => void;
};

/**
 * 予報がある期間（今日から5日ぶん）を含む週だけを並べたカレンダー。
 * 日付を押すとその日の予報に切り替わる。
 * 表示範囲が予報期間から決まるので、内部に状態を持たない。
 */
export default function Calendar({ days, selected, onSelect }: Props) {
  if (days.length === 0) return null;

  const byDate = new Map(days.map((d) => [d.date, d]));

  // 予報の初日を含む週の日曜 〜 最終日を含む週の土曜まで
  const first = toDate(days[0].date);
  const last = toDate(days[days.length - 1].date);
  const gridStart = addDays(first, -first.getUTCDay());
  const gridEnd = addDays(last, 6 - last.getUTCDay());
  const cellCount = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;

  const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
  const heading =
    months.length === 1
      ? `${first.getUTCFullYear()}年${first.getUTCMonth() + 1}月`
      : `${first.getUTCFullYear()}年${first.getUTCMonth() + 1}月 - ${last.getUTCMonth() + 1}月`;

  return (
    <section className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <h2 className="mb-4 text-center text-lg font-semibold tracking-wide">
        {heading}
      </h2>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEK.map((w, i) => (
          <div
            key={w}
            className={`pb-1 font-medium ${
              i === 0
                ? "text-rose-200"
                : i === 6
                  ? "text-sky-200"
                  : "text-white/70"
            }`}
          >
            {w}
          </div>
        ))}

        {Array.from({ length: cellCount }, (_, i) => {
          const date = addDays(gridStart, i);
          const key = toKey(date);
          const dayNum = date.getUTCDate();
          const forecast = byDate.get(key);
          const isSelected = key === selected;
          // 月が変わる日は「10/1」のように月も出す
          const label = dayNum === 1 ? `${date.getUTCMonth() + 1}/1` : `${dayNum}`;

          if (!forecast) {
            return (
              <div
                key={key}
                className="flex h-16 items-start justify-center rounded-xl pt-1.5 text-white/25"
              >
                {label}
              </div>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${date.getUTCMonth() + 1}月${dayNum}日の予報を表示`}
              className={`flex h-16 flex-col items-center justify-start rounded-xl border transition ${
                isSelected
                  ? "border-white bg-white text-slate-900 shadow-lg"
                  : "border-white/25 bg-white/10 hover:bg-white/25"
              }`}
            >
              <span className="pt-0.5 text-xs font-semibold">{label}</span>
              <WeatherIcon
                icon={forecast.icon}
                alt={forecast.description}
                size={26}
              />
              <span className="-mt-1 text-[10px] leading-none">
                {Math.round(forecast.tempMax)}° / {Math.round(forecast.tempMin)}°
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-white/60">
        無料プランのため予報は5日先までです（色付きの日を選べます）
      </p>
    </section>
  );
}
