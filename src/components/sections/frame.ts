import type { CSSProperties } from "react";

export function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const ch = (i: number) => parseInt(h.slice(i, i + 2), 16);
  const mix = (c: number) => (amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const hx = (c: number) =>
    Math.max(0, Math.min(255, Math.round(mix(c)))).toString(16).padStart(2, "0");
  return `#${hx(ch(0))}${hx(ch(2))}${hx(ch(4))}`;
}

// Pair with the global .pixel-frame class for square pixel corners.
export function frameStyle(color = "#ffffff"): CSSProperties {
  return {
    "--frame-light": shade(color, 0.4),
    "--frame-dark": shade(color, -0.4),
  } as CSSProperties;
}

// Tints an .mc-button with a custom hex from JSON.
export function buttonStyle(color?: string): CSSProperties | undefined {
  if (!color) return undefined;
  return {
    "--btn-bg": color,
    "--btn-bg-hover": shade(color, 0.15),
    "--btn-bg-active": shade(color, -0.2),
  } as CSSProperties;
}
