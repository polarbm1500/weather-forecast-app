import { NextResponse } from "next/server";
import { getWeather, OwmError } from "@/lib/openweather";

// ブラウザ（クライアント側）から呼ばれる唯一の入口。
// 検索や現在地ボタンでの再取得はここを通る。
// 実際の OpenWeatherMap 呼び出しは lib/openweather.ts（サーバー側）が行う。

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim();
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  try {
    if (latParam !== null && lonParam !== null) {
      const lat = Number(latParam);
      const lon = Number(lonParam);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return NextResponse.json(
          { error: "緯度・経度の値が不正です。" },
          { status: 400 },
        );
      }
      return NextResponse.json(await getWeather({ lat, lon }));
    }

    if (city) {
      return NextResponse.json(await getWeather({ city }));
    }

    return NextResponse.json(
      { error: "city か lat/lon のどちらかを指定してください。" },
      { status: 400 },
    );
  } catch (err) {
    if (err instanceof OwmError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[/api/weather]", err);
    return NextResponse.json(
      { error: "天気データの取得中に予期しないエラーが発生しました。" },
      { status: 500 },
    );
  }
}
