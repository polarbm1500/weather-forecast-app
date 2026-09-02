import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "天気予報アプリ",
  description:
    "OpenWeatherMap と連携して、都市や現在地の気温・天気・湿度・降水確率をカレンダーから日付を選んで確認できるアプリ",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
