// アプリ全体で使い回す型定義。
// API ルート（サーバー側）が OpenWeatherMap のレスポンスをこの形に整形し、
// 画面（クライアント側）はこの型だけを見ればよい状態にしている。

/** 3時間ごとの予報1コマ */
export type Slot = {
  dt: number;
  timeLabel: string; // "15:00"
  temp: number;
  feelsLike: number;
  humidity: number; // %
  pop: number; // 降水確率 %
  windSpeed: number; // m/s
  description: string;
  icon: string;
};

/** 1日ぶんの予報（3時間ごとのコマを日付でまとめたもの） */
export type DayForecast = {
  date: string; // "2026-09-02"（対象都市のローカル日付）
  weekday: string; // "火"
  label: string; // "9/2(火)"
  tempMax: number;
  tempMin: number;
  pop: number; // その日の最大降水確率 %
  humidity: number; // その日の平均湿度 %
  description: string;
  icon: string;
  slots: Slot[];
};

/** 現在の天気 */
export type CurrentWeather = {
  dt: number;
  timeLabel: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  description: string;
  icon: string;
  sunrise: string;
  sunset: string;
};

/** /api/weather が返す最終形 */
export type WeatherResponse = {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
    timezone: number; // UTC からの秒数オフセット
  };
  current: CurrentWeather;
  days: DayForecast[];
  fetchedAt: number;
};

/** エラー時に返す形 */
export type WeatherError = { error: string };
