import { useEffect, useLayoutEffect, useRef, useState } from "react";
import arrowUrl from "../assets/sprites/arrow_down.png";
import navData from "../data/navbar/navbar.json";
import "./navbar.css";

type LinkKind = "url" | "scroll" | "page";

interface NavLink {
  name: string;
  link: LinkKind;
  route: string;
}

interface NavButton extends NavLink {
  type?: "button" | "dropdown";
}

interface DropdownSection {
  header?: string;
  items: NavLink[];
}

// Buttons and dropdown are global — shared across every page and variant.
const buttons = navData.buttons as NavButton[];
const dropdown = navData.dropdown as DropdownSection[];

// Per-page variant pools: { "<page path>": ["grass", ...] }. The current page's
// list is chosen from at random on load; only the colours/animation change.
const PAGES = ((navData as { pages?: Record<string, string[]> }).pages ??
  {}) as Record<string, string[]>;

const SCROLL_THRESHOLD = 24; // px scrolled before the bar drops a shadow

// The bar background is a procedural pixel grid (ROWS rows of square cells; each
// cell picks from a pool = a base colour with a lighter mix at mixChance). A
// variant just swaps pools, dig depth/timing, and logo — behaviour is identical.
// Add "sand" / "snow" to VARIANTS in the same shape.
const ROWS = 8;

interface PoolDef {
  base: string;
  mix: string;
  mixChance: number;
}

interface Variant {
  logo: string; // png filename in src/assets/logo
  cap: PoolDef; // top rows (grass / snow / ...)
  body: PoolDef; // middle rows (dirt / sand / ...)
  dug: PoolDef; // exposed on hover (stone / ice / ...)
  capRow: number; // fraction of row 1 that is cap colour
  dugFrom: number; // topmost dug row (50/50 transition); rows below = full dug
  dugRow: number; // fraction of the transition row that is dug
  rowStep: number; // ms between rows during the dig
  jitter: number; // ms random spread within a row
  textDelay: number; // ms before the label engraves
}

const VARIANTS: Record<string, Variant> = {
  grass: {
    logo: "logo.png",
    cap: { base: "#48a72c", mix: "#57c136", mixChance: 0.4 },
    body: { base: "#6b4a2c", mix: "#76512f", mixChance: 0.15 },
    dug: { base: "#8c8c8c", mix: "#a6a6a6", mixChance: 0.05 },
    capRow: 0.5,
    dugFrom: 2,
    dugRow: 0.5,
    rowStep: 40,
    jitter: 70,
    textDelay: 160,
  },
};

function pickVariant(): Variant {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const names = PAGES[path] ?? PAGES["/"] ?? ["grass"];
  const name = names[Math.floor(Math.random() * names.length)];
  return VARIANTS[name] ?? VARIANTS.grass;
}

// Logo png lookup so a variant can target any file in src/assets/logo by name.
const LOGOS = import.meta.glob("../assets/logo/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function resolveLogo(name: string): string {
  const hit = Object.entries(LOGOS).find(([path]) => path.endsWith(`/${name}`));
  return hit ? hit[1] : "";
}

function pickPool(p: PoolDef, r: number) {
  return r < p.mixChance ? p.mix : p.base;
}

// A small tiling texture painted from a pool — fills the dropdown with the dug
// pool (speckles and all) rather than a flat colour.
const TEX = 32; // texture tile size, in cells
function makeTexture(p: PoolDef): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TEX;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  for (let y = 0; y < TEX; y++)
    for (let x = 0; x < TEX; x++) {
      ctx.fillStyle = pickPool(p, Math.random());
      ctx.fillRect(x, y, 1, 1);
    }
  return `url(${canvas.toDataURL()})`;
}

// Idle colour (cap + body) and hovered colour (cap kept, lower rows dug out).
function cellColors(v: Variant, row: number, rShade: number, rLayer: number) {
  let normal: string;
  if (row === 0) normal = pickPool(v.cap, rShade);
  else if (row === 1)
    normal = rLayer < v.capRow ? pickPool(v.cap, rShade) : pickPool(v.body, rShade);
  else normal = pickPool(v.body, rShade);

  let hover = normal;
  if (row > v.dugFrom) hover = pickPool(v.dug, rShade);
  else if (row === v.dugFrom)
    hover = rLayer < v.dugRow ? pickPool(v.dug, rShade) : pickPool(v.body, rShade);

  return { normal, hover };
}

interface Grid {
  cols: number;
  cell: number;
  normal: string[];
  hover: string[];
  // top strip of the dropdown: 50% body / 50% dug, plus a full-dug variant used
  // directly under the open (hovered) dropdown button.
  strip: string[];
  stripDug: string[];
}

// Resolve a nav item's destination. External `url`s open in a new tab; `scroll`
// and `page` are stubbed until those targets exist.
function follow(item: NavLink) {
  switch (item.link) {
    case "scroll":
      // TODO: scroll to the section named by `route`
      break;
    case "page":
      // TODO: client-side navigate to `route` (e.g. "/games")
      window.location.href = item.route;
      break;
    case "url":
    default:
      window.open(item.route, "_blank", "noopener,noreferrer");
      break;
  }
}

export default function Navbar() {
  const [variant] = useState(pickVariant);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [grid, setGrid] = useState<Grid | null>(null);
  const [dugTex, setDugTex] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const lastRange = useRef<[number, number] | null>(null);
  const activeBtn = useRef<HTMLElement | null>(null);

  const wordmark = resolveLogo(variant.logo);

  useEffect(() => setDugTex(makeTexture(variant.dug)), [variant]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Build the grid sized to the bar; rebuild on resize.
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const build = () => {
      const { width, height } = bar.getBoundingClientRect();
      const cell = height / ROWS;
      const cols = Math.ceil(width / cell);
      const normal: string[] = [];
      const hover: string[] = [];
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < cols; col++) {
          const c = cellColors(variant, row, Math.random(), Math.random());
          normal.push(c.normal);
          hover.push(c.hover);
        }
      }
      const strip: string[] = [];
      const stripDug: string[] = [];
      for (let col = 0; col < cols; col++) {
        const rShade = Math.random();
        strip.push(
          Math.random() < 0.5
            ? pickPool(variant.body, rShade)
            : pickPool(variant.dug, rShade),
        );
        stripDug.push(pickPool(variant.dug, rShade));
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

  // Snap the previously hovered column back to its idle colour, no animation.
  const resetRange = (g: HTMLElement) => {
    if (!grid || !lastRange.current) return;
    const [c0, c1] = lastRange.current;
    for (let row = variant.dugFrom; row < ROWS; row++)
      for (let col = c0; col < c1; col++)
        setCell(g, row * grid.cols + col, grid.normal[row * grid.cols + col]);
    lastRange.current = null;
  };

  // Dig away the body under a hovered button: dug pool flips in row by row from
  // the bottom up, with a random spread inside each row.
  const hoverButton = (btn: HTMLElement): [number, number] | null => {
    const g = gridRef.current;
    if (!g || !grid) return null;
    clearTimers();
    resetRange(g);

    const gRect = g.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const c0 = Math.max(0, Math.floor((r.left - gRect.left) / grid.cell));
    const c1 = Math.min(grid.cols, Math.ceil((r.right - gRect.left) / grid.cell));
    lastRange.current = [c0, c1];

    for (let row = variant.dugFrom; row < ROWS; row++) {
      const rowDelay = variant.rowStep * (ROWS - 1 - row); // bottom row first
      for (let col = c0; col < c1; col++) {
        const i = row * grid.cols + col;
        const delay = rowDelay + Math.random() * variant.jitter;
        timers.current.push(
          window.setTimeout(() => setCell(g, i, grid.hover[i]), delay),
        );
      }
    }
    return [c0, c1];
  };

  // Darken the label only once the dig has exposed the dug pool beneath it.
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

  // The dropdown's top strip: full dug directly under the open button, 50/50
  // body/dug everywhere else.
  const paintStrip = (range: [number, number] | null) => {
    const s = stripRef.current;
    if (!s || !grid) return;
    for (let col = 0; col < grid.cols; col++) {
      const inRange = range && col >= range[0] && col < range[1];
      setCell(s, col, inRange ? grid.stripDug[col] : grid.strip[col]);
    }
  };

  // Fill the body back in (top of the dug region first) when leaving the bar.
  const clearHover = () => {
    const g = gridRef.current;
    if (!g || !grid || !lastRange.current) return;
    clearTimers();
    const [c0, c1] = lastRange.current;
    lastRange.current = null;
    for (let row = variant.dugFrom; row < ROWS; row++) {
      const rowDelay = variant.rowStep * (row - variant.dugFrom); // top first
      for (let col = c0; col < c1; col++) {
        const i = row * grid.cols + col;
        const delay = rowDelay + Math.random() * variant.jitter;
        timers.current.push(
          window.setTimeout(() => setCell(g, i, grid.normal[i]), delay),
        );
      }
    }
  };

  const className = [
    "navbar",
    scrolled && "navbar--scrolled",
    open && "navbar--open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header
      className={className}
      onMouseLeave={() => {
        setOpen(false);
        clearHover();
        clearDugText();
      }}
    >
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

        <nav className="navbar__links">
          {buttons.map((item) => {
            const isDropdown = item.type === "dropdown";
            return (
              <button
                className="navbar__btn"
                key={item.name}
                aria-expanded={isDropdown ? open : undefined}
                onMouseEnter={(e) => {
                  setOpen(isDropdown);
                  const range = hoverButton(e.currentTarget);
                  paintStrip(isDropdown ? range : null);
                  setDugText(e.currentTarget);
                }}
                onClick={() => (isDropdown ? setOpen((v) => !v) : follow(item))}
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
      </div>

      <div
        className="navbar__panel"
        style={{
          backgroundColor: variant.dug.base,
          backgroundImage: dugTex,
          backgroundSize: grid
            ? `${TEX * grid.cell}px ${TEX * grid.cell}px`
            : undefined,
        }}
      >
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

        <div className="navbar__columns">
          {dropdown.map((section, i) => (
            <div className="navbar__column" key={section.header ?? i}>
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
