# 天気予報アプリ

OpenWeatherMap の無料 API と連携した天気予報 Web アプリです。
都市名の検索・現在地取得に対応し、カレンダーから日付を選ぶと
その日の予報（気温 / 天気 / 湿度 / 降水確率）に切り替わります。

**デモ**: https://weather-forecast-app-polarbm1500s-projects.vercel.app

## 機能

- **現在の天気**: 気温・体感温度・天気・湿度・降水確率・風速・気圧・日の出/日の入り
- **都市検索**: 日本語でも英語でも検索可能（見つからない場合は `都市名,JP` で再試行）
- **現在地**: ブラウザの位置情報から天気を取得
- **カレンダー**: 予報がある日（今日から5日先まで）を選んで切り替え
- **おでかけアドバイス**: 傘の要否・服装・寒暖差・熱中症などを予報から自動判定して表示
- **お気に入り都市**: よく見る都市を保存して1クリックで切り替え（`localStorage`、DB不要）
- **グラフ**: 選んだ日の気温と降水確率を時系列で表示（ホバーで各時刻の詳細）
- **3時間ごとの詳細**: 数値の表も折りたたみで確認可能
- 天気に合わせて背景のグラデーションが変化

## 技術構成

| | |
|---|---|
| フレームワーク | Next.js 16（App Router） |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| API | OpenWeatherMap（Current Weather / 5 day-3 hour Forecast / Geocoding） |
| ホスティング | Vercel |

### API キーの扱い

ブラウザから OpenWeatherMap を直接叩くと API キーが漏れてしまいます。
そこでこのアプリでは **サーバー側の API ルート** を経由させています。

```
ブラウザ  ──>  /api/weather?city=東京   ──>  OpenWeatherMap
              (app/api/weather/route.ts)
              ここでだけ process.env.OPENWEATHER_API_KEY を読む
```

- キーは `.env.local`（Git 管理外）と Vercel の環境変数にだけ置く
- `NEXT_PUBLIC_` プレフィックスは **付けない**（付けるとブラウザに埋め込まれる）
- 同じ問い合わせは 10 分キャッシュして無料枠を節約

## セットアップ

### 1. API キーを取得

1. https://openweathermap.org/ で無料アカウントを作成
2. https://home.openweathermap.org/api_keys でキーをコピー
3. 発行直後は有効化されていません（**最大2時間ほど**待つと使えます）

### 2. 環境変数を設定

`.env.local` を作り、キーを書きます。

```bash
cp .env.example .env.local
```

```env
OPENWEATHER_API_KEY=ここに取得したキー
```

### 3. 開発サーバーを起動

```bash
npm install
npm run dev
```

http://localhost:3000 を開きます。

## Vercel へのデプロイ

1. このリポジトリを GitHub に push
2. https://vercel.com/new から対象リポジトリを Import
3. **Environment Variables** に `OPENWEATHER_API_KEY` を追加（Production / Preview / Development すべてにチェック）
4. Deploy

環境変数を後から変更した場合は、Vercel 側で再デプロイすると反映されます。

## ディレクトリ構成

```
weather-app/
├ app/
│  ├ api/weather/route.ts  … サーバー側。OpenWeatherMap を代理で叩いて整形する
│  ├ page.tsx              … 画面本体（状態管理と組み立て）
│  ├ layout.tsx
│  └ globals.css
├ components/
│  ├ WeatherApp.tsx        … クライアント側の状態管理と組み立て
│  ├ SearchBar.tsx         … 都市検索・現在地・お気に入りの一覧
│  ├ CurrentCard.tsx       … 現在の天気カード（★でお気に入り登録）
│  ├ Calendar.tsx          … カレンダー（日付を選ぶ）
│  ├ AdviceCard.tsx        … 傘・服装などのアドバイス表示
│  ├ DayDetail.tsx         … 選択日の詳細（グラフ + 表）
│  ├ HourlyChart.tsx       … 気温と降水確率のグラフ（素のSVG）
│  └ WeatherIcon.tsx
├ lib/
│  ├ openweather.ts        … サーバー専用。API 呼び出しと整形
│  ├ types.ts              … アプリ共通の型
│  ├ advice.ts             … 予報からアドバイス文を組み立てる純粋関数
│  ├ favorites.ts          … お気に入りの保存（localStorage）
│  └ theme.ts              … 天気に応じた背景色
└ .env.example
```

## 実装上のポイント

### お気に入りと hydration

`localStorage` はブラウザにしか存在せず、サーバー側では読めません。素朴に実装すると
サーバーが生成した HTML とブラウザの初回描画がズレて hydration mismatch になります。
`lib/favorites.ts` では React の `useSyncExternalStore` を使い、サーバー用の値（空配列）と
ブラウザ用の値を明示的に分けることでこれを回避しています。

### グラフの設計

気温（°C）と降水確率（%）は単位もスケールも違うため、1つのグラフに2本の縦軸を
重ねると誤読を招きます。そこで **x軸（時刻）だけを共有した2段組み**にしています。
配色は暗い面の上での可読性と色覚多様性（P型・D型・T型）を検証済みです。

## 補足

- 無料プランの Forecast API は「5日先まで・3時間刻み」です。カレンダーで選べるのはその範囲の日付だけです。
- 気温は摂氏（`units=metric`）、天気の説明は日本語（`lang=ja`）で取得しています。
