import {
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import arrowUrl from "../assets/sprites/arrow_down.png";
import navData from "../data/navbar/navbar.json";
import { currentSlug, goToPage, scrollToId } from "../lib/router";
import { getGame } from "../lib/games";
import "./navbar.css";

type LinkKind = "url" | "scroll" | "page";

export interface NavLink {
  name: string;
  link: LinkKind;
  route: string;
}

export interface NavButton extends NavLink {
  type?: "button" | "dropdown";
}

export interface DropdownSection {
  header?: string;
  items: NavLink[];
}

const buttons = navData.buttons as NavButton[];
const dropdown = navData.dropdown as DropdownSection[];

// per-page variant pools, one picked at random on load
const PAGES = ((navData as { pages?: Record<string, string[]> }).pages ??
  {}) as Record<string, string[]>;

const SCROLL_THRESHOLD = 24; // px scrolled before the bar drops a shadow

export const ROWS = 8;

export type Pool = { color: string; weight: number }[];

export const POOLS: Record<string, Pool> = {
  grass: [
    { color: "#48a72c", weight: 34 },
    { color: "#57c136", weight: 33 },
    { color: "#6bce4dff", weight: 33 },

  ],
  dirt: [
    { color: "#704f31ff", weight: 75 },
    { color: "#6b4a2c", weight: 15 },
    { color: "#815a36ff", weight: 10 },
  ],
  stone: [
    { color: "#8c8c8c", weight: 70 },
    { color: "#888888ff", weight: 30 },
  ],
  snow: [
    { color: "#e9f1fc", weight: 84 },
    { color: "#dee7f7ff", weight: 16 },
  ],
  ice: [
    { color: "#a6cdf2", weight: 80 },
    { color: "#b4d6f4ff", weight: 10 },
    { color: "#c1ddf9ff", weight: 10 },
  ],
  sand: [
    { color: "#edcb80ff", weight: 30 },
    { color: "#e1c37dff", weight: 70 },
  ],
  jungleDirt: [
    { color: "#b06a35ff", weight: 75 },
    { color: "#a46230ff", weight: 15 },
    { color: "#985a2cff", weight: 10 },
  ],
  nightMud: [
    { color: "#291f14ff", weight: 70 },
    { color: "#241a0eff", weight: 30 },
  ],
  water: [
    { color: "#3f8fd0", weight: 60 },
    { color: "#2f72b0", weight: 25 },
    { color: "#5aa6e0", weight: 15 },
  ],
  purple: [
    { color: "#b252de", weight: 60 },
    { color: "#a23fd0", weight: 25 },
    { color: "#a850d1", weight: 15 },
  ],
  purple_dark: [
    { color: "#863ea7", weight: 60 },
    { color: "#6e2d8b", weight: 25 },
    { color: "#693283", weight: 15 },
  ],
};

// sand tide shades, light to deep
export const WAVE_SHADES = ["#bfe6ff", "#86c6ef", "#479bd8", "#2f72b0"];

export function pick(pool: Pool, r: number): string {
  let t = r * pool.reduce((s, c) => s + c.weight, 0);
  for (const c of pool) if ((t -= c.weight) < 0) return c.color;
  return pool[pool.length - 1].color;
}

// value noise in [0,1), neighbouring cells blend instead of flickering per-pixel
const NOISE_X = 4;
const NOISE_Y = 1.4;
function hash2(x: number, y: number, seed: number): number {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise(col: number, row: number, seed: number): number {
  const x = col / NOISE_X;
  const y = row / NOISE_Y;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = (x - x0) * (x - x0) * (3 - 2 * (x - x0));
  const fy = (y - y0) * (y - y0) * (3 - 2 * (y - y0));
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  const top = a + (b - a) * fx;
  return top + (c + (d - c) * fx - top) * fy;
}

interface WaveConfig {
  shades: string[]; // surface to deep
  peakRows: number; // water height at the hovered centre
  edgeRows: number; // water height at the hovered edges
  amp: number; // surface wobble amplitude, in rows
  speed: number; // animation speed
  freq: number; // radians per column (smaller = longer wavelength)
}

interface Variant {
  logo: string; // png filename in src/assets/logo
  darkText?: boolean; // dark idle labels (for light surfaces)
  body: Pool; // dropdown strip's non-dug half
  dug: Pool; // dropdown fill + strip's dug half
  surface: (row: number, rs: number, rl: number) => string; // idle cell colour
  dig?: (row: number, rs: number, rl: number) => string; // hovered colour (dug rows)
  digSequence?: number[][]; // rows flipped per step, in animation order
  wave?: WaveConfig; // if set, hover runs a tide animation instead of a dig
  rowStep: number; // ms between dig steps
  jitter: number; // ms random spread within a step
  textDelay: number; // ms before the label engraves
}

const VARIANTS: Record<string, Variant> = {
  grass: {
    logo: "logo_grass.png",
    body: POOLS.dirt,
    dug: POOLS.stone,
    surface: (row, rs, rl) =>
      row === 0
        ? pick(POOLS.grass, rs)
        : row === 1
          ? rl < 0.5
            ? pick(POOLS.grass, rs)
            : pick(POOLS.dirt, rs)
          : pick(POOLS.dirt, rs),
    dig: (row, rs, rl) =>
      row === 2
        ? rl < 0.5
          ? pick(POOLS.stone, rs)
          : pick(POOLS.dirt, rs)
        : pick(POOLS.stone, rs),
    digSequence: [[7], [6], [5], [4], [3], [2]], // bottom up
    rowStep: 40,
    jitter: 70,
    textDelay: 160,
  },
  jungle: {
    logo: "logo_grass.png",
    body: POOLS.jungleDirt,
    dug: POOLS.nightMud,
    surface: (row, rs, rl) =>
      row === 0
        ? pick(POOLS.grass, rs)
        : row === 1
          ? rl < 0.5
            ? pick(POOLS.grass, rs)
            : pick(POOLS.jungleDirt, rs)
          : pick(POOLS.jungleDirt, rs),
    dig: (row, rs, rl) =>
      row === 2
        ? rl < 0.5
          ? pick(POOLS.nightMud, rs)
          : pick(POOLS.jungleDirt, rs)
        : pick(POOLS.nightMud, rs),
    digSequence: [[7], [6], [5], [4], [3], [2]], // bottom up
    rowStep: 40,
    jitter: 70,
    textDelay: 160,
  },
  snow: {
    logo: "logo_snow.png",
    darkText: true,
    body: POOLS.snow,
    dug: POOLS.ice,
    surface: (_row, rs) => pick(POOLS.snow, rs), // uniform snow
    dig: (row, rs, rl) =>
      row === 1 || row === 6
        ? rl < 0.5
          ? pick(POOLS.ice, rs)
          : pick(POOLS.snow, rs)
        : pick(POOLS.ice, rs),
    digSequence: [[3, 4], [2, 5], [1, 6]], // centre out, 1px edges
    rowStep: 45,
    jitter: 60,
    textDelay: 80,
  },
  sand: {
    logo: "logo_sand.png",
    darkText: true,
    body: POOLS.sand,
    dug: POOLS.sand, // dropdown is sand (animated waves are a follow-up)
    surface: (_row, rs) => pick(POOLS.sand, rs), // 2 shades of sand
    wave: {
      shades: WAVE_SHADES,
      peakRows: 7, // taller hover swell
      edgeRows: 2,
      amp: 0.9,
      speed: 0.004,
      freq: 0.22, // long, smooth wavelength
    },
    rowStep: 0,
    jitter: 0,
    textDelay: 0,
  },
  purple: {
    logo: "logo_purple.png",
    darkText: true,
    body: POOLS.purple,
    dug: POOLS.purple_dark,
    surface: (_row, rs) => pick(POOLS.purple, rs),
    dig: (row, rs, rl) =>
      row === 1 || row === 6
        ? rl < 0.5
          ? pick(POOLS.purple_dark, rs)
          : pick(POOLS.purple, rs)
        : pick(POOLS.purple_dark, rs),
    digSequence: [[3, 4], [2, 5], [1, 6]],
    rowStep: 0,
    jitter: 80,
    textDelay: 50,
  },
};

function pickVariantName(): string {
  const slug = typeof window !== "undefined" ? currentSlug() : "";
  // a game's own JSON overrides navbar.json's page pool
  const gameVariant = slug ? getGame(slug)?.navbarVariant : undefined;
  const fromGame = gameVariant
    ? Array.isArray(gameVariant)
      ? gameVariant
      : [gameVariant]
    : undefined;
  const key = slug ? `/${slug}` : "/";
  const names = fromGame ?? PAGES[key] ?? PAGES.default ?? PAGES["/"] ?? ["grass"];
  const name = names[Math.floor(Math.random() * names.length)];
  return name in VARIANTS ? name : "grass";
}

// Chosen once on load and shared with the footer so they always match.
export const VARIANT_NAME = pickVariantName();

const LOGOS = import.meta.glob("../assets/logo/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function resolveLogo(name: string): string {
  const hit = Object.entries(LOGOS).find(([path]) => path.endsWith(`/${name}`));
  return hit ? hit[1] : "";
}

export const TEX = 32; // texture tile size, in cells
export function makeTexture(p: Pool): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TEX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  for (let y = 0; y < TEX; y++)
    for (let x = 0; x < TEX; x++) {
      ctx.fillStyle = pick(p, noise(x, y, 5));
      ctx.fillRect(x, y, 1, 1);
    }
  return `url(${canvas.toDataURL()})`;
}

// idle surface as a ROWS-tall texture, used for the footer's top strip
export function surfaceTexture(name: string): string {
  const v = VARIANTS[name] ?? VARIANTS.grass;
  const canvas = document.createElement("canvas");
  canvas.width = TEX;
  canvas.height = ROWS;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  for (let row = 0; row < ROWS; row++)
    for (let x = 0; x < TEX; x++) {
      ctx.fillStyle = v.surface(row, noise(x, row, 11), noise(x, row, 23));
      ctx.fillRect(x, row, 1, 1);
    }
  return `url(${canvas.toDataURL()})`;
}

interface Grid {
  cols: number;
  cell: number;
  normal: string[];
  hover: string[];
  // dropdown top strip: half body/dug, plus a full-dug row for the open button
  strip: string[];
  stripDug: string[];
}

// scroll = home section, page = game route, url = external
export function follow(item: NavLink) {
  switch (item.link) {
    case "scroll":
      scrollToId(item.route);
      break;
    case "page":
      goToPage(item.route);
      break;
    case "url":
    default:
      window.open(item.route, "_blank", "noopener,noreferrer");
      break;
  }
}

export default function Navbar() {
  const [variantName] = useState(VARIANT_NAME);
  const variant = VARIANTS[variantName];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [dugTex, setDugTex] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wavesRef = useRef<HTMLCanvasElement>(null);
  const timers = useRef<number[]>([]);
  const lastRange = useRef<[number, number] | null>(null);
  const activeBtn = useRef<HTMLElement | null>(null);
  const waveRAF = useRef(0);
  const waveTarget = useRef<[number, number] | null>(null); // button to aim at, or null = recede
  const waveOpen = useRef(false); // target is the dropdown button
  const waveLevel = useRef<number[]>([]); // per-column water level, eased in place
  const waveStart = useRef(0);
  const gridDataRef = useRef<Grid | null>(null);
  gridDataRef.current = grid; // keep the loop reading the latest grid across resizes

  const wordmark = resolveLogo(variant.logo);
  const brandIcon = resolveLogo("icon.png");

  useEffect(() => setDugTex(makeTexture(variant.dug)), [variant]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => () => cancelAnimationFrame(waveRAF.current), []);

  // Build the grid sized to the bar; rebuild on resize.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const build = () => {
      const { width, height } = bar.getBoundingClientRect();
      const cell = height / ROWS;
      const cols = Math.ceil(width / cell);
      const dug = new Set((variant.digSequence ?? []).flat());
      const normal: string[] = [];
      const hover: string[] = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < cols; col++) {
          const rs = noise(col, row, 11);
          const rl = noise(col, row, 23);
          const n = variant.surface(row, rs, rl);
          normal.push(n);
          hover.push(dug.has(row) && variant.dig ? variant.dig(row, rs, rl) : n);
        }
      }
      const strip: string[] = [];
      const stripDug: string[] = [];
      for (let col = 0; col < cols; col++) {
        const rs = noise(col, 0, 31);
        strip.push(noise(col, 0, 41) < 0.5 ? pick(variant.body, rs) : pick(variant.dug, rs));
        stripDug.push(pick(variant.dug, rs));
      }
      setGrid({ cols, cell, normal, hover, strip, stripDug });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(bar);
    return () => ro.disconnect();
  }, [variant]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const setCell = (g: HTMLElement, i: number, color: string) => {
    const cell = g.children[i] as HTMLElement | undefined;
    if (cell) cell.style.backgroundColor = color;
  };

  const columnRange = (btn: HTMLElement): [number, number] => {
    const g = gridRef.current!;
    const gLeft = g.getBoundingClientRect().left;
    const r = btn.getBoundingClientRect();
    const c0 = Math.max(0, Math.floor((r.left - gLeft) / grid!.cell));
    const c1 = Math.min(grid!.cols, Math.ceil((r.right - gLeft) / grid!.cell));
    return [c0, c1];
  };

  // dig variants: grass, snow

  const resetRange = (g: HTMLElement) => {
    if (!grid || !lastRange.current) return;
    const [c0, c1] = lastRange.current;
    for (const row of (variant.digSequence ?? []).flat())
      for (let col = c0; col < c1; col++)
        setCell(g, row * grid.cols + col, grid.normal[row * grid.cols + col]);
    lastRange.current = null;
  };

  const hoverButton = (btn: HTMLElement): [number, number] | null => {
    const g = gridRef.current;
    if (!g || !grid) return null;
    clearTimers();
    resetRange(g);
    const [c0, c1] = columnRange(btn);
    lastRange.current = [c0, c1];
    (variant.digSequence ?? []).forEach((rows, step) => {
      const stepDelay = step * variant.rowStep;
      for (const row of rows)
        for (let col = c0; col < c1; col++) {
          const i = row * grid.cols + col;
          const delay = stepDelay + Math.random() * variant.jitter;
          timers.current.push(
            window.setTimeout(() => setCell(g, i, grid.hover[i]), delay),
          );
        }
    });
    return [c0, c1];
  };

  const clearHover = () => {
    const g = gridRef.current;
    if (!g || !grid || !lastRange.current) return;
    clearTimers();
    const [c0, c1] = lastRange.current;
    lastRange.current = null;
    const steps = (variant.digSequence ?? []).length;
    (variant.digSequence ?? []).forEach((rows, step) => {
      const stepDelay = (steps - 1 - step) * variant.rowStep;
      for (const row of rows)
        for (let col = c0; col < c1; col++) {
          const i = row * grid.cols + col;
          const delay = stepDelay + Math.random() * variant.jitter;
          timers.current.push(
            window.setTimeout(() => setCell(g, i, grid.normal[i]), delay),
          );
        }
    });
  };

  const setDugText = (btn: HTMLElement) => {
    if (activeBtn.current) activeBtn.current.classList.remove("navbar__btn--dug");
    activeBtn.current = btn;
    timers.current.push(
      window.setTimeout(
        () => btn.classList.add("navbar__btn--dug"),
        variant.textDelay,
      ),
    );
  };

  const clearDugText = () => {
    if (activeBtn.current) {
      activeBtn.current.classList.remove("navbar__btn--dug");
      activeBtn.current = null;
    }
  };

  const paintStrip = (range: [number, number] | null) => {
    const s = stripRef.current;
    if (!s || !grid) return;
    for (let col = 0; col < grid.cols; col++) {
      const inRange = range && col >= range[0] && col < range[1];
      setCell(s, col, inRange ? grid.stripDug[col] : grid.strip[col]);
    }
  };

  // wave variant (sand): animated tide in the hovered column

  // shared wobble so the bar and dropdown read as one tide
  const wobbleAt = (w: WaveConfig, col: number, t: number) =>
    w.amp * Math.sin(col * w.freq + t * w.speed) +
    0.5 * w.amp * Math.sin(col * w.freq * 2 - t * w.speed * 1.7);

  const FALLOFF = 18; // wide bell so it reaches neighbouring columns

  // eases each column's water level toward the target; null recedes
  const aimWave = (range: [number, number] | null, isDropdown: boolean) => {
    if (!variant.wave || !grid) return;
    waveTarget.current = range;
    waveOpen.current = isDropdown && !!range;
    if (!waveRAF.current) {
      waveStart.current = performance.now();
      waveRAF.current = requestAnimationFrame(waveFrame);
    }
  };

  const waveFrame = (now: number) => {
    const g = gridRef.current;
    const grid = gridDataRef.current;
    const w = variant.wave;
    if (!g || !grid || !w) {
      waveRAF.current = 0;
      return;
    }
    const t = now - waveStart.current;
    const tgt = waveTarget.current;
    const last = w.shades.length - 1;
    const cols = grid.cols;

    // eased toward the target, 1 at its centre
    let level = waveLevel.current;
    if (level.length !== cols) {
      level = new Array(cols).fill(0);
      waveLevel.current = level;
    }
    const tmid = tgt ? (tgt[0] + tgt[1] - 1) / 2 : 0;
    const thalf = tgt ? Math.max(1, (tgt[1] - tgt[0]) / 2) : 1;
    let maxLevel = 0;
    for (let col = 0; col < cols; col++) {
      let target = 0;
      if (tgt) {
        const d = Math.abs(col - tmid) / (thalf + FALLOFF);
        if (d < 1) target = 0.5 + 0.5 * Math.cos(Math.PI * d);
      }
      level[col] += (target - level[col]) * 0.15; // rise/fall in place
      if (level[col] > maxLevel) maxLevel = level[col];
    }

    const breathe = 0.8 + 0.2 * Math.sin(t * 0.0013);
    const peakLift = w.peakRows * breathe;

    // dropdown sizing (only while the dropdown is the target)
    const canvas = wavesRef.current;
    const panel = panelRef.current;
    const ctx = waveOpen.current ? (canvas?.getContext("2d") ?? null) : null;
    let prows = 0;
    let sandTop = ROWS;
    if (ctx && canvas && panel) {
      prows = Math.max(1, Math.round(panel.getBoundingClientRect().height / grid.cell));
      sandTop = Math.round(prows * 0.1); // water covers ~90%, sand on top
      if (canvas.width !== cols || canvas.height !== prows) {
        canvas.width = cols;
        canvas.height = prows;
      }
      ctx.clearRect(0, 0, cols, prows);
    } else if (canvas) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    }

    // sand on top, water below, lifted per column
    const surface = (col: number) => {
      const hf = level[col];
      return sandTop * (1 - hf) - peakLift * hf + wobbleAt(w, col, t);
    };

    for (let col = 0; col < cols; col++) {
      const s = surface(col);
      for (let row = 0; row < ROWS; row++) {
        const i = row * cols + col;
        const depth = row - ROWS - s;
        if (depth > 0) setCell(g, i, w.shades[Math.min(last, Math.floor(depth))]);
        else setCell(g, i, grid.normal[i]);
      }
    }

    // dropdown surface, same shape as the bar above
    if (ctx) {
      for (let col = 0; col < cols; col++) {
        const s = surface(col);
        let prev = Math.max(0, Math.ceil(s));
        for (let k = 0; k <= last; k++) {
          const raw = k === last ? prows : Math.ceil(s + k + 1);
          const next = Math.min(prows, Math.max(prev, raw));
          if (next > prev) {
            ctx.fillStyle = w.shades[k];
            ctx.fillRect(col, prev, 1, next - prev);
          }
          prev = next;
        }
        if (s > 0.5) {
          const foam =
            Math.sin(col * w.freq * 0.9 - t * w.speed * 2.4) +
            Math.sin(col * w.freq * 2.3 + t * w.speed * 1.1);
          const fy = Math.round(s);
          if (foam > 1.15 && fy >= 0 && fy < prows) {
            ctx.fillStyle = w.shades[0];
            ctx.fillRect(col, fy, 1, 1);
          }
        }
      }
    }

    if (tgt || maxLevel > 0.01) {
      waveRAF.current = requestAnimationFrame(waveFrame);
    } else {
      waveRAF.current = 0; // fully receded, stop the loop
    }
  };

  const onEnter = (e: PointerEvent<HTMLElement>, isDropdown: boolean) => {
    // touch fires a synthetic hover before click, so only real mouse opens here
    if (e.pointerType === "mouse") setOpen(isDropdown);
    const btn = e.currentTarget;
    if (variant.wave) {
      aimWave(columnRange(btn), isDropdown);
    } else {
      const range = hoverButton(btn);
      paintStrip(isDropdown ? range : null);
      setDugText(btn);
    }
  };

  const onLeave = () => {
    setOpen(false);
    if (variant.wave) aimWave(null, false);
    else {
      clearHover();
      clearDugText();
    }
  };

  const className = [
    "navbar",
    `navbar--${variantName}`,
    scrolled && "navbar--scrolled",
    open && "navbar--open",
    variant.darkText && "navbar--darktext",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={className} onMouseLeave={onLeave}>
      <div className="navbar__bar" ref={barRef}>
        <div
          className="navbar__grid"
          ref={gridRef}
          aria-hidden="true"
          style={
            grid
              ? {
                  gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
                  gridAutoRows: `${grid.cell}px`,
                }
              : undefined
          }
        >
          {grid?.normal.map((color, i) => (
            <div key={i} style={{ backgroundColor: color }} />
          ))}
        </div>

        <a className="navbar__brand" href="/" aria-label="Zeronia home">
          <img className="navbar__wordmark" src={wordmark} alt="Zeronia" />
        </a>

        <div className="navbar__right">
        <nav className="navbar__links">
          {buttons.map((item) => {
            const isDropdown = item.type === "dropdown";
            return (
              <button
                className="navbar__btn"
                key={item.name}
                aria-expanded={isDropdown ? open : undefined}
                onPointerEnter={(e) => onEnter(e, isDropdown)}
                onClick={() => {
                  if (isDropdown) setOpen((v) => !v);
                  else {
                    setOpen(false);
                    follow(item);
                  }
                }}
              >
                {item.name}
                {isDropdown && (
                  <img
                    className="navbar__caret"
                    src={arrowUrl}
                    alt=""
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <a className="navbar__brand-icon" href="/" aria-label="Zeronia home">
          <img className="navbar__icon" src={brandIcon} alt="" aria-hidden="true" />
        </a>
        </div>
      </div>

      <div
        className="navbar__panel"
        ref={panelRef}
        style={{
          backgroundColor: variant.dug[0].color,
          backgroundImage: dugTex,
          backgroundSize: grid
            ? `${TEX * grid.cell}px ${TEX * grid.cell}px`
            : undefined,
        }}
      >
        {variant.wave ? (
          <canvas className="navbar__waves" ref={wavesRef} aria-hidden="true" />
        ) : (
          <div
            className="navbar__strip"
            ref={stripRef}
            aria-hidden="true"
            style={
              grid
                ? {
                    gridTemplateColumns: `repeat(${grid.cols}, ${grid.cell}px)`,
                    height: `${grid.cell}px`,
                  }
                : undefined
            }
          >
            {grid?.strip.map((color, i) => (
              <div key={i} style={{ backgroundColor: color }} />
            ))}
          </div>
        )}

        <div className="navbar__columns">
          {dropdown.map((section, i) => (
            <div
              className="navbar__column"
              key={section.header ?? i}
              data-header={section.header}
            >
              {section.header && (
                <span className="navbar__col-header">{section.header}</span>
              )}
              {section.items.map((sub) => (
                <button
                  className="mc-button navbar__menu-item"
                  key={sub.name}
                  onClick={() => follow(sub)}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
