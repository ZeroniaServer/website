import { type ReactNode, useMemo } from "react";
import { type Pool, noise, pick } from "../navbar";
import "./section.css";

export const CELL = 8;
const FIELD = 48;

function fieldTexture(pool: Pool): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = FIELD;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  for (let y = 0; y < FIELD; y++)
    for (let x = 0; x < FIELD; x++) {
      ctx.fillStyle = pick(pool, noise(x, y, 7));
      ctx.fillRect(x, y, 1, 1);
    }
  return `url(${canvas.toDataURL()})`;
}

function seamTexture(a: Pool, b: Pool): string {
  const canvas = document.createElement("canvas");
  canvas.width = FIELD;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  for (let x = 0; x < FIELD; x++) {
    ctx.fillStyle =
      noise(x, 0, 61) < 0.5 ? pick(a, noise(x, 0, 63)) : pick(b, noise(x, 0, 63));
    ctx.fillRect(x, 0, 1, 1);
  }
  return `url(${canvas.toDataURL()})`;
}

export function fieldStyle(pool: Pool) {
  return {
    backgroundColor: pool[0].color,
    backgroundImage: fieldTexture(pool),
    backgroundSize: `${FIELD * CELL}px ${FIELD * CELL}px`,
  };
}

export const DEEPSLATE: Pool = [
  { color: "#313137", weight: 55 },
  { color: "#2b2b31", weight: 45 },
];

export const DEEPSLATE_LIGHT: Pool = [
  { color: "#3e3e45", weight: 55 },
  { color: "#38383f", weight: 45 },
];

interface SectionProps {
  id: string;
  pool: Pool;
  title?: string;
  className?: string;
  children: ReactNode;
}

export default function Section({ id, pool, title, className, children }: SectionProps) {
  const style = useMemo(() => fieldStyle(pool), [pool]);
  return (
    <section id={id} className={["section", className].filter(Boolean).join(" ")} style={style}>
      <div className="section__inner">
        {title && <h2 className="section__title">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

export function Seam({ above, below }: { above: Pool; below: Pool }) {
  const style = useMemo(
    () => ({
      height: `${CELL}px`,
      backgroundImage: seamTexture(above, below),
      backgroundSize: `${FIELD * CELL}px ${CELL}px`,
    }),
    [above, below],
  );
  return <div className="section__seam" aria-hidden="true" style={style} />;
}
