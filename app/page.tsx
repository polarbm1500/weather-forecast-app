"use client";

import { useCallback, useEffect, useState } from "react";
import Calendar from "@/components/Calendar";
import CurrentCard from "@/components/CurrentCard";
import DayDetail from "@/components/DayDetail";
import SearchBar from "@/components/SearchBar";
import { backgroundFor } from "@/lib/theme";
import type { WeatherResponse } from "@/lib/types";

const DEFAULT_CITY = "東京";

export default function Home() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** サーバー側の /api/weather を呼ぶ（OpenWeatherMap は直接叩かない） */
  const load = useCallback(async (params: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/weather?${new URLSearchParams(params)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "天気を取得できませんでした。");

      const weather = json as WeatherResponse;
      setData(weather);
      setSelected(weather.days[0]?.date ?? "");
    } catch (e) {
      // 失敗しても直前の表示は残す（エラーだけ上に出す）
      setError(e instanceof Error ? e.message : "天気を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回は既定の都市を表示
  useEffect(() => {
    load({ city: DEFAULT_CITY });
  }, [load]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError("このブラウザでは現在地を取得できません。");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        load({
          lat: String(pos.coords.latitude),
          lon: String(pos.coords.longitude),
        });
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "位置情報の利用が許可されませんでした。ブラウザの設定を確認してください。"
            : "現在地を取得できませんでした。",
        );
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, [load]);

  const day = data?.days.find((d) => d.date === selected) ?? data?.days[0];
  const background = backgroundFor(data?.current.icon);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${background} text-white transition-colors duration-700`}
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <p className="mb-3 text-xs tracking-[0.2em] text-white/60">
            WEATHER FORECAST
          </p>
          <SearchBar
            onSearch={(city) => load({ city })}
            onLocate={locate}
            loading={loading}
            locating={locating}
          />
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-rose-200/40 bg-rose-500/25 px-4 py-3 text-sm backdrop-blur-md"
          >
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="rounded-3xl border border-white/20 bg-white/10 p-10 text-center text-sm text-white/80 backdrop-blur-md">
            読み込み中…
          </div>
        )}

        {data && (
          <div
            className={`space-y-5 transition-opacity ${loading ? "opacity-50" : ""}`}
          >
            <div className="grid gap-5 lg:grid-cols-2">
              <CurrentCard
                location={data.location}
                current={data.current}
                pop={data.days[0]?.pop ?? null}
              />
              {selected && (
                <Calendar
                  days={data.days}
                  selected={selected}
                  onSelect={setSelected}
                />
              )}
            </div>

            {day && <DayDetail day={day} isToday={day.date === data.days[0]?.date} />}
          </div>
        )}

        <footer className="mt-8 text-center text-[11px] text-white/50">
          データ提供: OpenWeatherMap（現在の天気 + 5日/3時間ごと予報）
        </footer>
      </main>
    </div>
  );
}
