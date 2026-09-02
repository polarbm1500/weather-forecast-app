import type { CurrentWeather, DayForecast, Slot, WeatherResponse } from "./types";

// ============================================================================
// OpenWeatherMap との通信をまとめたモジュール。
// このファイルは「サーバー側でしか読み込まれない」前提。
// process.env.OPENWEATHER_API_KEY をここでだけ参照するので、
// API キーがブラウザに渡ることはない。
//
// 使う API（いずれも無料プランで利用可能）:
//   - /geo/1.0/direct   都市名 -> 緯度経度
//   - /geo/1.0/reverse  緯度経度 -> 地名
//   - /data/2.5/weather 現在の天気
//   - /data/2.5/forecast 5日間・3時間ごとの予報（降水確率 pop を含む）
// ============================================================================

const BASE = "https://api.openweathermap.org";
const UNITS = "metric"; // 摂氏
const LANG = "ja";
const REVALIDATE = 600; // 同じ問い合わせは10分キャッシュ（無料枠を無駄使いしない）

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** HTTP ステータス付きのエラー。API ルート側でそのまま応答に使う */
export class OwmError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "OwmError";
    this.status = status;
  }
}

/** OpenWeatherMap を叩く共通処理 */
async function owmFetch<T>(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<T> {
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("appid", apiKey);

  const res = await fetch(url, { next: { revalidate: REVALIDATE } });

  if (!res.ok) {
    if (res.status === 401) {
      throw new OwmError(
        "API キーが無効です。.env.local（Vercel では環境変数）の OPENWEATHER_API_KEY を確認してください。発行直後のキーは有効になるまで最大2時間ほどかかります。",
        502,
      );
    }
    if (res.status === 404) {
      throw new OwmError("その地点の天気データが見つかりませんでした。", 404);
    }
    if (res.status === 429) {
      throw new OwmError(
        "API の呼び出し回数が上限に達しました。しばらく待ってから試してください。",
        429,
      );
    }
    throw new OwmError(
      `天気データの取得に失敗しました（OpenWeatherMap: ${res.status}）。`,
      502,
    );
  }
  return res.json() as Promise<T>;
}

// --- OpenWeatherMap のレスポンス型（使う部分だけ） ---------------------------

type GeoEntry = {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
};

type OwmWeather = { description: string; icon: string; id: number };

type CurrentRes = {
  dt: number;
  timezone: number;
  name: string;
  sys: { country?: string; sunrise: number; sunset: number };
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  wind: { speed: number };
  weather: OwmWeather[];
};

type ForecastRes = {
  city: { name: string; country: string; timezone: number };
  list: {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_max: number;
      temp_min: number;
      humidity: number;
    };
    wind: { speed: number };
    pop?: number;
    weather: OwmWeather[];
  }[];
};

// --- 日時ユーティリティ ------------------------------------------------------
// OpenWeatherMap の dt は UTC の秒。対象都市のオフセットを足してから
// getUTC* 系で読むと「その都市のローカル時刻」が得られる。

function cityLocal(dt: number, tzOffset: number): Date {
  return new Date((dt + tzOffset) * 1000);
}

const pad = (n: number) => String(n).padStart(2, "0");

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function timeLabel(d: Date): string {
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const round = (n: number) => Math.round(n);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** 3時間ごとのリストを「日付ごと」にまとめ直す */
function groupByDay(forecast: ForecastRes): DayForecast[] {
  const tz = forecast.city.timezone;
  const buckets = new Map<string, Slot[]>();

  for (const item of forecast.list) {
    const local = cityLocal(item.dt, tz);
    const key = dateKey(local);
    const slot: Slot = {
      dt: item.dt,
      timeLabel: timeLabel(local),
      temp: round1(item.main.temp),
      feelsLike: round1(item.main.feels_like),
      humidity: item.main.humidity,
      pop: round((item.pop ?? 0) * 100),
      windSpeed: round1(item.wind.speed),
      description: item.weather[0]?.description ?? "-",
      icon: item.weather[0]?.icon ?? "01d",
    };
    const arr = buckets.get(key);
    if (arr) arr.push(slot);
    else buckets.set(key, [slot]);
  }

  const days: DayForecast[] = [];
  for (const [key, slots] of buckets) {
    // その日を代表する天気は「正午に一番近いコマ」から取る
    const representative =
      slots.reduce<{ slot: Slot; diff: number } | null>((best, s) => {
        const hour = Number(s.timeLabel.slice(0, 2));
        const diff = Math.abs(hour - 12);
        return !best || diff < best.diff ? { slot: s, diff } : best;
      }, null)?.slot ?? slots[0];

    const [y, m, d] = key.split("-").map(Number);
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];

    days.push({
      date: key,
      weekday,
      label: `${m}/${d}(${weekday})`,
      tempMax: round1(Math.max(...slots.map((s) => s.temp))),
      tempMin: round1(Math.min(...slots.map((s) => s.temp))),
      pop: Math.max(...slots.map((s) => s.pop)),
      humidity: round(
        slots.reduce((sum, s) => sum + s.humidity, 0) / slots.length,
      ),
      description: representative.description,
      icon: representative.icon,
      slots,
    });
  }

  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/** 都市名 -> 緯度経度（見つからなければ ",JP" を付けて再挑戦） */
async function geocode(city: string, apiKey: string): Promise<GeoEntry> {
  const lookup = (q: string) =>
    owmFetch<GeoEntry[]>("/geo/1.0/direct", { q, limit: "5" }, apiKey);

  let hits = await lookup(city);
  if (hits.length === 0 && !city.includes(",")) {
    hits = await lookup(`${city},JP`);
  }
  if (hits.length === 0) {
    throw new OwmError(
      `「${city}」が見つかりませんでした。英語表記（例: Tokyo）や「都市名,JP」の形式も試してみてください。`,
      404,
    );
  }
  return hits[0];
}

/** 緯度経度 -> 地名（現在地ボタン用） */
async function reverseGeocode(
  lat: number,
  lon: number,
  apiKey: string,
): Promise<GeoEntry | null> {
  const hits = await owmFetch<GeoEntry[]>(
    "/geo/1.0/reverse",
    { lat: String(lat), lon: String(lon), limit: "1" },
    apiKey,
  );
  return hits[0] ?? null;
}

/** 日本語の地名があればそちらを使う */
function displayName(entry: GeoEntry | null, fallback: string): string {
  return entry?.local_names?.ja ?? entry?.name ?? fallback;
}

export type WeatherQuery =
  | { city: string }
  | { lat: number; lon: number };

/**
 * 都市名または緯度経度から、画面が必要とする形の天気データを組み立てる。
 * 失敗時は OwmError を投げる。
 */
export async function getWeather(query: WeatherQuery): Promise<WeatherResponse> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new OwmError(
      "OPENWEATHER_API_KEY が設定されていません。.env.local に実際のキーを書いて開発サーバーを再起動してください（Vercel では環境変数に追加）。",
      500,
    );
  }

  let lat: number;
  let lon: number;
  let place: GeoEntry | null = null;

  if ("city" in query) {
    place = await geocode(query.city, apiKey);
    lat = place.lat;
    lon = place.lon;
  } else {
    lat = query.lat;
    lon = query.lon;
    place = await reverseGeocode(lat, lon, apiKey);
  }

  const coords = {
    lat: String(lat),
    lon: String(lon),
    units: UNITS,
    lang: LANG,
  };

  // 現在の天気と5日ぶんの予報を並行取得
  const [current, forecast] = await Promise.all([
    owmFetch<CurrentRes>("/data/2.5/weather", coords, apiKey),
    owmFetch<ForecastRes>("/data/2.5/forecast", coords, apiKey),
  ]);

  const tz = forecast.city.timezone ?? current.timezone;

  const currentWeather: CurrentWeather = {
    dt: current.dt,
    timeLabel: timeLabel(cityLocal(current.dt, tz)),
    temp: round1(current.main.temp),
    feelsLike: round1(current.main.feels_like),
    humidity: current.main.humidity,
    pressure: current.main.pressure,
    windSpeed: round1(current.wind.speed),
    description: current.weather[0]?.description ?? "-",
    icon: current.weather[0]?.icon ?? "01d",
    sunrise: timeLabel(cityLocal(current.sys.sunrise, tz)),
    sunset: timeLabel(cityLocal(current.sys.sunset, tz)),
  };

  return {
    location: {
      name: displayName(place, current.name),
      country: place?.country ?? current.sys.country ?? "",
      lat,
      lon,
      timezone: tz,
    },
    current: currentWeather,
    days: groupByDay(forecast),
    fetchedAt: Date.now(),
  };
}
