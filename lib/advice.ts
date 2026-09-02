import type { DayForecast } from "./types";

// ============================================================================
// 予報の数字を「持ち物・服装のひとこと」に翻訳する。
// 外部との通信をしない純粋な関数なので、入力が同じなら結果も必ず同じ。
// ============================================================================

export type AdviceTone = "alert" | "notice" | "calm";

export type AdviceItem = {
  icon: string;
  title: string;
  detail: string;
  tone: AdviceTone;
};

export type Advice = {
  headline: string;
  headlineIcon: string;
  items: AdviceItem[];
};

const MAX_ITEMS = 4;

/** 気温（最高気温）から服装を決める */
function clothingAdvice(tempMax: number): AdviceItem {
  const tone: AdviceTone = tempMax >= 30 || tempMax < 5 ? "alert" : "notice";

  if (tempMax >= 30) {
    return {
      icon: "👕",
      title: "半袖で過ごせる暑さです",
      detail: "日差しが強い時間帯は日陰を選んで移動しましょう。",
      tone,
    };
  }
  if (tempMax >= 25) {
    return {
      icon: "👕",
      title: "半袖がちょうどいい陽気です",
      detail: "日中は汗ばむことがあります。",
      tone,
    };
  }
  if (tempMax >= 20) {
    return {
      icon: "👔",
      title: "長袖シャツがちょうどいい気温です",
      detail: "重ね着で調整しやすい一日です。",
      tone,
    };
  }
  if (tempMax >= 15) {
    return {
      icon: "🧥",
      title: "薄手の上着があると安心です",
      detail: "風が吹くと肌寒く感じます。",
      tone,
    };
  }
  if (tempMax >= 10) {
    return {
      icon: "🧥",
      title: "ジャケットやコートが必要です",
      detail: "朝晩はさらに冷え込みます。",
      tone,
    };
  }
  if (tempMax >= 5) {
    return {
      icon: "🧣",
      title: "厚手のコートを着ましょう",
      detail: "マフラーがあると快適に過ごせます。",
      tone,
    };
  }
  return {
    icon: "🧣",
    title: "しっかり防寒してください",
    detail: "手袋やマフラーを忘れずに。",
    tone,
  };
}

/** 降水確率から傘の要否を決める */
function umbrellaAdvice(day: DayForecast): AdviceItem {
  // 「いつ降るか」を伝えたいので、最初に降水確率が上がる時間帯を探す
  const firstRain = day.slots.find((s) => s.pop >= 40);
  const when = firstRain ? `${firstRain.timeLabel}ごろ` : null;

  if (day.pop >= 70) {
    return {
      icon: "☔",
      title: "傘を必ず持っていきましょう",
      detail: when
        ? `${when}から降りやすくなります（降水確率 最大${day.pop}%）。`
        : `降水確率は最大 ${day.pop}% です。`,
      tone: "alert",
    };
  }
  if (day.pop >= 50) {
    return {
      icon: "☔",
      title: "傘があると安心です",
      detail: when
        ? `${when}に降る可能性があります（降水確率 最大${day.pop}%）。`
        : `降水確率は最大 ${day.pop}% です。`,
      tone: "alert",
    };
  }
  if (day.pop >= 30) {
    return {
      icon: "🌂",
      title: "折りたたみ傘があると安心です",
      detail: `にわか雨の可能性があります（降水確率 最大${day.pop}%）。`,
      tone: "notice",
    };
  }
  return {
    icon: "☀️",
    title: "傘はいらなそうです",
    detail: `降水確率は最大 ${day.pop}% です。`,
    tone: "calm",
  };
}

/** 1日ぶんの予報から、その日のアドバイスを組み立てる */
export function buildAdvice(day: DayForecast): Advice {
  const items: AdviceItem[] = [];

  // 雪は傘より先に伝えたい
  if (day.slots.some((s) => s.icon.startsWith("13"))) {
    items.push({
      icon: "❄️",
      title: "雪の予報です",
      detail: "足元が滑りやすくなります。時間に余裕を持って出かけましょう。",
      tone: "alert",
    });
  }

  items.push(umbrellaAdvice(day));
  items.push(clothingAdvice(day.tempMax));

  const gap = day.tempMax - day.tempMin;
  if (gap >= 8) {
    items.push({
      icon: "🌡️",
      title: `朝晩と日中で ${Math.round(gap)}度 の気温差があります`,
      detail: "脱ぎ着できる羽織りものを持っていくと安心です。",
      tone: "notice",
    });
  }

  if (day.tempMax >= 33) {
    items.push({
      icon: "🥵",
      title: "熱中症に警戒してください",
      detail: "こまめに水分と塩分を補給しましょう。",
      tone: "alert",
    });
  } else if (day.tempMax >= 28 && day.humidity >= 75) {
    items.push({
      icon: "💧",
      title: "蒸し暑くなりそうです",
      detail: `湿度が ${day.humidity}% と高めです。通気性のよい服装を。`,
      tone: "notice",
    });
  } else if (day.humidity <= 35) {
    items.push({
      icon: "💧",
      title: "空気が乾燥しています",
      detail: `湿度は ${day.humidity}% です。喉や肌の乾燥対策を。`,
      tone: "notice",
    });
  }

  const maxWind = Math.max(...day.slots.map((s) => s.windSpeed));
  if (maxWind >= 8) {
    items.push({
      icon: "🌬️",
      title: "風が強い時間帯があります",
      detail: `最大 ${maxWind} m/s。傘が壊れやすいので注意してください。`,
      tone: maxWind >= 12 ? "alert" : "notice",
    });
  }

  // 警戒すべきものを先頭へ（同じ強さなら追加した順のまま）
  const order: Record<AdviceTone, number> = { alert: 0, notice: 1, calm: 2 };
  const sorted = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => order[a.item.tone] - order[b.item.tone] || a.i - b.i)
    .map(({ item }) => item)
    .slice(0, MAX_ITEMS);

  return {
    headline: sorted[0].title,
    headlineIcon: sorted[0].icon,
    items: sorted,
  };
}
