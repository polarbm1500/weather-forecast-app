"use client";

import { useEffect, useState } from "react";
import type { DayForecast } from "@/lib/types";
import WeatherIcon from "./WeatherIcon";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  days: DayForecast[];
  selected: string;
  onSelect: (date: string) => void;
};

/**
 * 月表示のカレンダー。
 * 予報が存在する日（無料プランなので今日から5日ぶん）だけが押せて、
 * 押すとその日の予報に切り替わる。
 */
export default function Calendar({ days, selected, onSelect }: Props) {
  const [view, setView] = useState(() => selected.slice(0, 7)); // "YYYY-MM"

  // 都市を変えるなどして選択日が変わったら、その月を表示する
  useEffect(() => {
    if (selected) setView(selected.slice(0, 7));
  }, [selected]);

  const byDate = new Map(days.map((d) => [d.date, d]));
  const [year, month] = view.split("-").map(Number);

  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length }, (_, i) => i + 1),
  ];

  const months = Array.from(new Set(days.map((d) => d.date.slice(0, 7))));
  const canPrev = months.some((m) => m < view);
  const canNext = months.some((m) => m > view);

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    setView(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };

  return (
    <section className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canPrev}
          aria-label="前の月"
          className="rounded-full px-3 py-1 text-lg transition enabled:hover:bg-white/20 disabled:opacity-25"
        >
          ‹
        </button>
        <h2 className="text-lg font-semibold tracking-wide">
          {year}年{month}月
        </h2>
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={!canNext}
          aria-label="次の月"
          className="rounded-full px-3 py-1 text-lg transition enabled:hover:bg-white/20 disabled:opacity-25"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEK.map((w, i) => (
          <div
            key={w}
            className={`pb-1 font-medium ${
              i === 0 ? "text-rose-200" : i === 6 ? "text-sky-200" : "text-white/70"
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const key = `${year}-${pad(month)}-${pad(day)}`;
          const forecast = byDate.get(key);
          const isSelected = key === selected;

          if (!forecast) {
            return (
              <div
                key={key}
                className="flex h-16 items-start justify-center rounded-xl pt-1.5 text-white/25"
              >
                {day}
              </div>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`flex h-16 flex-col items-center justify-start rounded-xl border transition ${
                isSelected
                  ? "border-white bg-white text-slate-900 shadow-lg"
                  : "border-white/25 bg-white/10 hover:bg-white/25"
              }`}
            >
              <span className="pt-0.5 text-xs font-semibold">{day}</span>
              <WeatherIcon icon={forecast.icon} alt={forecast.description} size={26} />
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
