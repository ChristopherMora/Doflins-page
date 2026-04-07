import { PARTICLE_COLOR } from "./constants";

export function RarityParticles({ rarity }: { rarity: string }): React.JSX.Element {
  const color = PARTICLE_COLOR[rarity] ?? "rgba(213,154,26,0.75)";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          className="particle-float absolute rounded-full"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            backgroundColor: color,
            left: `${10 + i * 15}%`,
            bottom: "8%",
            animationDuration: `${2.4 + i * 0.35}s`,
            animationDelay: `${i * 0.45}s`,
          }}
        />
      ))}
    </div>
  );
}
