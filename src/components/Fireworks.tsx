import type { CSSProperties } from "react";

// Kleine, kurze Feuerwerk-Animation für den Gewinn-Moment - bewusst kompakt und
// eingebettet statt vollflächig, damit es nicht aufdringlich wirkt.
const COLORS = ["#DC4FDB", "#80B737", "#9A64B9", "#E3A72F"];
const SPARKS = Array.from({ length: 16 }, (_, i) => i);

export function Fireworks() {
  return (
    <div className="fireworks" aria-hidden="true">
      {SPARKS.map((i) => {
        const angle = (i / SPARKS.length) * 360;
        const originX = i % 2 === 0 ? "30%" : "70%";
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            className="fireworks-spark"
            style={
              {
                left: originX,
                backgroundColor: color,
                "--angle": `${angle}deg`,
                animationDelay: `${(i % 2) * 0.15}s`
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
