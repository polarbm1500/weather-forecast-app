"use client";

import { useCallback, useState } from "react";
import AdviceCard from "@/components/AdviceCard";
import Calendar from "@/components/Calendar";
import CurrentCard from "@/components/CurrentCard";
import DayDetail from "@/components/DayDetail";
import SearchBar from "@/components/SearchBar";
import { buildAdvice } from "@/lib/advice";
import {
  isSameSpot,
  removeFavorite,
  toggleFavorite,
  useFavorites,
  type Favorite,
} from "@/lib/favorites";
import { backgroundFor } from "@/lib/theme";
import type { WeatherResponse } from "@/lib/types";

type Props = {
  /** サーバー側で取得済みの初期表示ぶん */
  initialData: WeatherResponse | null;
  initialError: string | null;
};

export default function WeatherApp({ initialData, initialError }: Props) {
  const [data, setData] = useState(initialData);
  const [selected, setSelected] = useState(initialData?.days[0]?.date ?? "");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(initialError);

  // localStorage の中身。サーバー描画時は空配列が使われるのでズレない
  const favorites = useFavorites();

  /** 検索・現在地での再取得。ブラウザは /api/weather だけを叩く */
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
      // 失敗しても直前の表示は残し、エラーだけ上に出す
      setError(e instanceof Error ? e.message : "天気を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const selectFavorite = useCallback(
    (fav: Favorite) => load({ lat: String(fav.lat), lon: String(fav.lon) }),
    [load],
  );

  const day = data?.days.find((d) => d.date === selected) ?? data?.days[0];
  const isToday = day !== undefined && day.date === data?.days[0]?.date;
  const background = backgroundFor(data?.current.icon);

  const currentSpot: Favorite | null = data
    ? { name: data.location.name, lat: data.location.lat, lon: data.location.lon }
    : null;
  const isFavorite =
    currentSpot !== null && favorites.some((f) => isSameSpot(f, currentSpot));

  return (
    <div className={`min-h-screen bg-gradient-to-b ${background}`}>
      {/* 背景のグラデーションは明るい色になることもあるので、
          白文字の読みやすさを保つために薄い暗幕を1枚重ねる */}
      <div className="min-h-screen bg-slate-950/25 text-white">
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
              favorites={favorites}
              onSelectFavorite={selectFavorite}
              onRemoveFavorite={removeFavorite}
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

          {data && currentSpot ? (
            <div
              className={`space-y-5 transition-opacity ${loading ? "opacity-50" : ""}`}
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <CurrentCard
                  location={data.location}
                  current={data.current}
                  pop={data.days[0]?.pop ?? null}
                  isFavorite={isFavorite}
                  onToggleFavorite={() => toggleFavorite(currentSpot)}
                />
                <Calendar
                  days={data.days}
                  selected={selected}
                  onSelect={setSelected}
                />
              </div>

              {day && (
                <AdviceCard
                  advice={buildAdvice(day)}
                  dayLabel={isToday ? `今日 ${day.label}` : day.label}
                />
              )}

              {day && <DayDetail day={day} isToday={isToday} />}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/20 bg-white/10 p-10 text-center text-sm text-white/80 backdrop-blur-md">
              {loading
                ? "読み込み中…"
                : "上の検索欄から都市を入力するか、「現在地」を押してください。"}
            </div>
          )}

          <footer className="mt-8 text-center text-[11px] text-white/50">
            データ提供: OpenWeatherMap（現在の天気 + 5日/3時間ごと予報）
          </footer>
        </main>
      </div>
    </div>
  );
}
