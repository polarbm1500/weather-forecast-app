"use client";

import { useState } from "react";

const QUICK_CITIES = ["東京", "大阪", "札幌", "名古屋", "福岡", "那覇", "London"];

type Props = {
  onSearch: (city: string) => void;
  onLocate: () => void;
  loading: boolean;
  locating: boolean;
};

export default function SearchBar({
  onSearch,
  onLocate,
  loading,
  locating,
}: Props) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const city = value.trim();
    if (city) onSearch(city);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="都市名で検索（例: 京都 / Paris）"
          aria-label="都市名"
          className="min-w-0 flex-1 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-sm placeholder:text-white/55 outline-none backdrop-blur-md focus:border-white/60 focus:bg-white/25"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition enabled:hover:bg-white/85 disabled:opacity-40"
        >
          検索
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={locating || loading}
          title="現在地の天気を表示"
          className="rounded-full border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition enabled:hover:bg-white/30 disabled:opacity-40"
        >
          {locating ? "取得中…" : "現在地"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => onSearch(city)}
            disabled={loading}
            className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs transition enabled:hover:bg-white/25 disabled:opacity-40"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
