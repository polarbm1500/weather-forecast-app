"use client";

import { useSyncExternalStore } from "react";

// ============================================================================
// お気に入り都市をブラウザの localStorage に保存する。
// データベースは不要だが、注意点が1つある:
//
//   localStorage はブラウザにしか存在せず、サーバー側では読めない。
//   このアプリは初期表示をサーバーで作っているので、素朴に実装すると
//   「サーバーが作った HTML」と「ブラウザが最初に描く内容」がズレて
//   hydration mismatch というエラーになる。
//
// それを正しく扱うのが React の useSyncExternalStore で、
// サーバー用の値（空配列）とブラウザ用の値を明示的に分けて渡せる。
// ============================================================================

export type Favorite = {
  name: string;
  lat: number;
  lon: number;
};

const STORAGE_KEY = "weather-app:favorites";
const MAX_FAVORITES = 8;

/** サーバー側と「未保存」で共有する空配列。毎回同じ参照を返すことが重要 */
const EMPTY: Favorite[] = [];

// getSnapshot は描画のたびに呼ばれる。毎回新しい配列を作ると
// 「変わった」と誤判定されて無限ループになるので、文字列が同じなら
// 前回の配列をそのまま返す。
let cachedRaw: string | null = null;
let cachedValue: Favorite[] = EMPTY;

const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // プライベートモードなどで localStorage が使えないことがある
    return null;
  }
}

function parse(raw: string | null): Favorite[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const list = parsed.filter(
      (v): v is Favorite =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as Favorite).name === "string" &&
        Number.isFinite((v as Favorite).lat) &&
        Number.isFinite((v as Favorite).lon),
    );
    return list.length > 0 ? list.slice(0, MAX_FAVORITES) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // 別タブでの変更も拾う（同じタブ内では storage イベントは飛ばない）
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Favorite[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parse(raw);
  }
  return cachedValue;
}

/** サーバーでの描画時に使う値。localStorage は読めないので常に空 */
function getServerSnapshot(): Favorite[] {
  return EMPTY;
}

function write(list: Favorite[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 保存できなくてもアプリは動き続ける
  }
  for (const listener of listeners) listener();
}

/** 同じ地点かどうかは緯度経度で判定する（表記ゆれの影響を受けないため） */
export function isSameSpot(a: Favorite, b: Favorite): boolean {
  return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
}

export function favoriteKey(fav: Favorite): string {
  return `${fav.lat.toFixed(2)},${fav.lon.toFixed(2)}`;
}

export function addFavorite(fav: Favorite): void {
  const current = getSnapshot();
  if (current.some((f) => isSameSpot(f, fav))) return;
  write([...current, fav].slice(0, MAX_FAVORITES));
}

export function removeFavorite(fav: Favorite): void {
  const current = getSnapshot();
  const next = current.filter((f) => !isSameSpot(f, fav));
  write(next.length > 0 ? next : []);
}

export function toggleFavorite(fav: Favorite): void {
  const current = getSnapshot();
  if (current.some((f) => isSameSpot(f, fav))) removeFavorite(fav);
  else addFavorite(fav);
}

/** 画面から使うためのフック */
export function useFavorites(): Favorite[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
