import type { DayForecast } from "@/lib/types";
import HourlyChart from "./HourlyChart";
import WeatherIcon from "./WeatherIcon";

type Props = {
  day: DayForecast;
  /** その日が今日かどうか（今日は過去のコマが欠けている旨を出す） */
  isToday: boolean;
};

export default function DayDetail({ day, isToday }: Props) {
  const [year, month, date] = day.date.split("-").map(Number);

  return (
    <section className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            {year}年{month}月{date}日（{day.weekday}）
            {isToday && (
              <span className="ml-2 rounded-full bg-white/25 px-2 py-0.5 text-xs align-middle">
                今日
              </span>
            )}
          </h2>
          <p className="text-sm text-white/80">{day.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <WeatherIcon icon={day.icon} alt={day.description} size={64} />
          <div className="text-right">
            <div className="text-2xl font-semibold tabular-nums">
              <span className="text-rose-200">{Math.round(day.tempMax)}°</span>
              <span className="mx-1 text-white/50">/</span>
              <span className="text-sky-200">{Math.round(day.tempMin)}°</span>
            </div>
            <div className="text-xs text-white/70">
              降水確率 {day.pop}%・湿度 {day.humidity}%
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <HourlyChart slots={day.slots} />
      </div>

      <details className="mt-4">
        <summary className="inline-block cursor-pointer rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs transition hover:bg-white/25">
          3時間ごとの数値を表で見る
        </summary>
        <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-white/60">
              <th className="py-2 pr-2 font-medium">時刻</th>
              <th className="py-2 pr-2 font-medium">天気</th>
              <th className="py-2 pr-2 text-right font-medium">気温</th>
              <th className="py-2 pr-2 text-right font-medium">降水確率</th>
              <th className="py-2 pr-2 text-right font-medium">湿度</th>
              <th className="py-2 text-right font-medium">風速</th>
            </tr>
          </thead>
          <tbody>
            {day.slots.map((slot) => (
              <tr key={slot.dt} className="border-t border-white/15">
                <td className="py-2 pr-2 tabular-nums">{slot.timeLabel}</td>
                <td className="py-1 pr-2">
                  <span className="flex items-center gap-1">
                    <WeatherIcon icon={slot.icon} alt={slot.description} size={32} />
                    <span className="text-xs text-white/85">{slot.description}</span>
                  </span>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  {Math.round(slot.temp)}°
                </td>
                <td
                  className={`py-2 pr-2 text-right tabular-nums ${
                    slot.pop >= 50 ? "font-semibold text-sky-200" : ""
                  }`}
                >
                  {slot.pop}%
                </td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  {slot.humidity}%
                </td>
                <td className="py-2 text-right tabular-nums">{slot.windSpeed}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </details>

      {isToday && day.slots.length < 8 && (
        <p className="mt-3 text-[11px] text-white/60">
          ※ 今日は残りの時間帯ぶんだけ表示しています。
        </p>
      )}
    </section>
  );
}
