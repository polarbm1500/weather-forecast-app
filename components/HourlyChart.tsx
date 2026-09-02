"use client";

import { useState } from "react";
import type { Slot } from "@/lib/types";

// ============================================================================
// 3時間ごとの気温と降水確率のグラフ。
//
// 気温(°C)と降水確率(%)は単位もスケールも違うので、1つのグラフに
// 2本の縦軸を重ねるのは誤読の原因になる（可視化の代表的なアンチパターン）。
// ここでは x 軸（時刻）だけを共有した2段組みにして、上下で見比べられるようにする。
//
// 色は暗い面（#1e293b）上での可読性と色覚多様性を検証済み:
//   気温 #ea580c / 降水確率 #3b82f6
// ============================================================================

const W = 640;
const H = 278;
const PAD_L = 46;
const PAD_R = 14;

const TEMP_TOP = 26;
const TEMP_H = 104;

// 降水確率100%の棒の上に値を置いても見出しと重ならないだけの間隔を空けている
const POP_TITLE_Y = 162;
const POP_TOP = 186;
const POP_H = 62;
const POP_BOTTOM = POP_TOP + POP_H;

const LABEL_Y = 266;

const TEMP_COLOR = "#ea580c";
const POP_COLOR = "#3b82f6";
const SURFACE = "#1e293b";

type Props = {
  slots: Slot[];
};

export default function HourlyChart({ slots }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  if (slots.length === 0) return null;

  const n = slots.length;
  const step = (W - PAD_L - PAD_R) / n;
  const xAt = (i: number) => PAD_L + (i + 0.5) * step;

  // --- 気温の縦軸の範囲を決める（上下に余白を持たせる） ---
  const temps = slots.map((s) => s.temp);
  let lo = Math.min(...temps);
  let hi = Math.max(...temps);
  const pad = Math.max(1, (hi - lo) * 0.25);
  lo -= pad;
  hi += pad;
  if (hi - lo < 4) {
    const mid = (hi + lo) / 2;
    lo = mid - 2;
    hi = mid + 2;
  }
  const tempY = (v: number) => TEMP_TOP + (1 - (v - lo) / (hi - lo)) * TEMP_H;
  const popY = (v: number) => POP_TOP + (1 - v / 100) * POP_H;

  const maxIndex = temps.indexOf(Math.max(...temps));
  const minIndex = temps.indexOf(Math.min(...temps));

  const linePath = slots
    .map((s, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${tempY(s.temp).toFixed(1)}`)
    .join(" ");

  const barWidth = Math.min(step * 0.5, 26);

  // 降水確率のピーク（20%未満なら伝える価値がないのでラベルしない）
  const maxPop = Math.max(...slots.map((s) => s.pop));
  const peakPopIndex =
    maxPop >= 20 ? slots.findIndex((s) => s.pop === maxPop) : null;

  /** 上端だけを丸めた棒グラフのパス */
  const barPath = (i: number, pop: number) => {
    const h = (pop / 100) * POP_H;
    if (h < 0.5) return null;
    const x = xAt(i) - barWidth / 2;
    const y = POP_BOTTOM - h;
    const r = Math.min(4, barWidth / 2, h);
    return `M${x},${POP_BOTTOM} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + barWidth - r},${y} Q${x + barWidth},${y} ${x + barWidth},${y + r} L${x + barWidth},${POP_BOTTOM} Z`;
  };

  const hovered = hover === null ? null : slots[hover];
  const tooltipLeft =
    hover === null ? 0 : Math.min(94, Math.max(6, (xAt(hover) / W) * 100));

  const summary = `${slots[0].timeLabel}から${slots[n - 1].timeLabel}までの気温と降水確率の推移。気温は${Math.round(Math.min(...temps))}度から${Math.round(Math.max(...temps))}度、降水確率は最大${Math.max(...slots.map((s) => s.pop))}パーセント。`;

  return (
    <div className="relative rounded-2xl bg-slate-800/90 p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={summary}
        onMouseLeave={() => setHover(null)}
      >
        {/* --- 上段: 気温 --- */}
        <circle cx={6} cy={10} r={4} fill={TEMP_COLOR} />
        <text x={16} y={14} fontSize={12} fill="rgba(255,255,255,0.85)">
          気温 (°C)
        </text>

        {[hi, (hi + lo) / 2, lo].map((v) => (
          <g key={`temp-grid-${v}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={tempY(v)}
              y2={tempY(v)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={tempY(v) + 4}
              fontSize={11}
              textAnchor="end"
              fill="rgba(255,255,255,0.55)"
            >
              {Math.round(v)}
            </text>
          </g>
        ))}

        {n > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke={TEMP_COLOR}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {slots.map((s, i) => (
          <circle
            key={`temp-dot-${s.dt}`}
            cx={xAt(i)}
            cy={tempY(s.temp)}
            r={hover === i ? 6 : 4}
            fill={TEMP_COLOR}
            stroke={SURFACE}
            strokeWidth={2}
          />
        ))}

        {/* 全点に数値を置くと読みにくいので、最高と最低だけ直接ラベルする */}
        {Array.from(new Set([maxIndex, minIndex])).map((i) => (
          <text
            key={`temp-label-${i}`}
            x={xAt(i)}
            y={tempY(temps[i]) - 12}
            fontSize={12}
            fontWeight={600}
            textAnchor="middle"
            fill="#ffffff"
          >
            {Math.round(temps[i])}°
          </text>
        ))}

        {/* --- 下段: 降水確率 --- */}
        <circle cx={6} cy={POP_TITLE_Y - 4} r={4} fill={POP_COLOR} />
        <text x={16} y={POP_TITLE_Y} fontSize={12} fill="rgba(255,255,255,0.85)">
          降水確率 (%)
        </text>

        {[100, 50, 0].map((v) => (
          <g key={`pop-grid-${v}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={popY(v)}
              y2={popY(v)}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={popY(v) + 4}
              fontSize={11}
              textAnchor="end"
              fill="rgba(255,255,255,0.55)"
            >
              {v}
            </text>
          </g>
        ))}

        {slots.map((s, i) => {
          const d = barPath(i, s.pop);
          if (!d) return null;
          return (
            <path
              key={`pop-bar-${s.dt}`}
              d={d}
              fill={POP_COLOR}
              opacity={hover === null || hover === i ? 1 : 0.55}
            />
          );
        })}

        {/* 全部の棒に数字を置くと読みにくいので、その日のピークだけラベルする
            （個別の値はホバーで見られる） */}
        {peakPopIndex !== null && (
          <text
            x={xAt(peakPopIndex)}
            y={popY(slots[peakPopIndex].pop) - 7}
            fontSize={12}
            fontWeight={600}
            textAnchor="middle"
            fill="#ffffff"
          >
            {slots[peakPopIndex].pop}%
          </text>
        )}

        {/* --- 共有の時刻ラベル --- */}
        {slots.map((s, i) => (
          <text
            key={`time-${s.dt}`}
            x={xAt(i)}
            y={LABEL_Y}
            fontSize={11}
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
          >
            {s.timeLabel}
          </text>
        ))}

        {/* --- ホバー用の縦線と当たり判定 --- */}
        {hover !== null && (
          <line
            x1={xAt(hover)}
            x2={xAt(hover)}
            y1={TEMP_TOP}
            y2={POP_BOTTOM}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1}
          />
        )}
        {slots.map((s, i) => (
          <rect
            key={`hit-${s.dt}`}
            x={PAD_L + i * step}
            y={TEMP_TOP}
            width={step}
            height={POP_BOTTOM - TEMP_TOP}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg ring-1 ring-white/20"
          style={{ left: `${tooltipLeft}%` }}
        >
          <div className="font-semibold">{hovered.timeLabel}</div>
          <div className="text-white/80">
            気温 {hovered.temp}°C ／ 降水 {hovered.pop}%
          </div>
          <div className="text-white/60">
            湿度 {hovered.humidity}% ／ 風 {hovered.windSpeed} m/s
          </div>
        </div>
      )}
    </div>
  );
}
