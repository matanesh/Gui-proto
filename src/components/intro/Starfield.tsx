import { useMemo } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

/** A cheap starfield: N absolutely-positioned dots, opacity-only twinkle animation. */
export function Starfield({ count = 110 }: { count?: number }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() < 0.85 ? 1 : 2,
        delay: Math.random() * 3,
        duration: 1.8 + Math.random() * 2.4,
      })),
    [count],
  );

  return (
    <div className="absolute inset-0" aria-hidden>
      {stars.map((star, i) => (
        <span
          key={i}
          className="intro-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
