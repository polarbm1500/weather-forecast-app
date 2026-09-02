// OpenWeatherMap が配信している天気アイコン。
// 外部ドメインの画像なので next/image ではなく素の img を使っている。

type Props = {
  icon: string;
  alt: string;
  size?: number;
  className?: string;
};

export default function WeatherIcon({ icon, alt, size = 64, className }: Props) {
  return (
    <img
      src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
      loading="lazy"
    />
  );
}
