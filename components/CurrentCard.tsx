import type { CurrentWeather, WeatherResponse } from "@/lib/types";
import WeatherIcon from "./WeatherIcon";

type Props = {
  location: WeatherResponse["location"];
  current: CurrentWeather;
  /** 今日の降水確率（3時間予報の最大値） */
  pop: number | null;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2">
      <div className="text-[11px] text-white/70">{label}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export default function CurrentCard({ location, current, pop }: Props) {
  return (
    <section className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">{location.name}</h1>
        {location.country && (
          <span className="text-sm text-white/70">{location.country}</span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-white/60">
        現地時刻 {current.timeLabel} 時点
      </p>

      <div className="mt-4 flex items-center gap-4">
        <WeatherIcon icon={current.icon} alt={current.description} size={96} />
        <div>
          <div className="text-6xl font-light leading-none tabular-nums">
            {Math.round(current.temp)}
            <span className="text-3xl align-top">°C</span>
          </div>
          <div className="mt-2 text-lg">{current.description}</div>
          <div className="text-sm text-white/70">
            体感 {Math.round(current.feelsLike)}°C
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="湿度" value={`${current.humidity}%`} />
        <Stat
          label="降水確率（今日）"
          value={pop === null ? "-" : `${pop}%`}
        />
        <Stat label="風速" value={`${current.windSpeed} m/s`} />
        <Stat label="気圧" value={`${current.pressure} hPa`} />
        <Stat label="日の出" value={current.sunrise} />
        <Stat label="日の入り" value={current.sunset} />
      </div>
    </section>
  );
}
