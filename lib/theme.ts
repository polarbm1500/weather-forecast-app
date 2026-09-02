// 天気アイコンのコードから背景のグラデーションを決める。
// 例: "10d" = 雨・昼、"01n" = 快晴・夜

const GRADIENTS: Record<string, string> = {
  "01d": "from-sky-400 via-sky-300 to-amber-200",
  "02d": "from-sky-500 via-sky-400 to-slate-300",
  "03d": "from-slate-400 via-slate-400 to-slate-500",
  "04d": "from-slate-500 via-slate-500 to-slate-600",
  "09d": "from-slate-600 via-blue-700 to-blue-900",
  "10d": "from-blue-500 via-blue-600 to-slate-700",
  "11d": "from-slate-700 via-indigo-800 to-slate-900",
  "13d": "from-sky-200 via-slate-300 to-slate-400",
  "50d": "from-slate-400 via-slate-500 to-slate-600",
};

const NIGHT = "from-slate-900 via-indigo-950 to-slate-800";

export function backgroundFor(icon: string | undefined): string {
  if (!icon) return "from-slate-700 via-slate-800 to-slate-900";
  if (icon.endsWith("n")) return NIGHT;
  return GRADIENTS[icon] ?? "from-slate-500 via-slate-600 to-slate-700";
}
