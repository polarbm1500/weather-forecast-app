import WeatherApp from "@/components/WeatherApp";
import { getWeather, OwmError } from "@/lib/openweather";
import type { WeatherResponse } from "@/lib/types";

const DEFAULT_CITY = "東京";

// 毎回サーバー側で最新を取りに行く（OpenWeatherMap への実際の通信は
// lib/openweather.ts が10分キャッシュするので、無料枠は圧迫しない）。
export const dynamic = "force-dynamic";

export default async function Home() {
  let initialData: WeatherResponse | null = null;
  let initialError: string | null = null;

  // 初期表示ぶんはサーバー側で取得しておく。
  // こうするとページを開いた瞬間に天気が出る（読み込み中の空白が出ない）。
  try {
    initialData = await getWeather({ city: DEFAULT_CITY });
  } catch (err) {
    initialError =
      err instanceof OwmError
        ? err.message
        : "天気データの取得に失敗しました。時間をおいて再読み込みしてください。";
  }

  return <WeatherApp initialData={initialData} initialError={initialError} />;
}
