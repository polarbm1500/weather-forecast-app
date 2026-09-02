import type { Advice, AdviceTone } from "@/lib/advice";

type Props = {
  advice: Advice;
  /** 「今日（9/2 水）」のような見出し用ラベル */
  dayLabel: string;
};

const TONE_STYLE: Record<AdviceTone, string> = {
  alert: "bg-amber-300/25 ring-amber-100/40",
  notice: "bg-white/10 ring-white/25",
  calm: "bg-white/5 ring-white/20",
};

export default function AdviceCard({ advice, dayLabel }: Props) {
  const [main, ...rest] = advice.items;

  return (
    <section className="rounded-3xl border border-white/25 bg-white/15 p-5 backdrop-blur-md sm:p-6">
      <p className="text-xs tracking-wide text-white/70">
        {dayLabel}のおでかけアドバイス
      </p>

      <div className="mt-3 flex items-start gap-4">
        <span className="text-4xl leading-none sm:text-5xl" aria-hidden="true">
          {advice.headlineIcon}
        </span>
        <div>
          <h2 className="text-xl leading-snug font-bold sm:text-2xl">
            {advice.headline}
          </h2>
          <p className="mt-1 text-sm text-white/85">{main.detail}</p>
        </div>
      </div>

      {rest.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {rest.map((item) => (
            <li
              key={item.title}
              className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 ring-1 ${TONE_STYLE[item.tone]}`}
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-white/75">{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
