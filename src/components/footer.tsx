import { useEffect, useRef } from "react";
import navData from "../data/navbar/navbar.json";
import footerData from "../data/footer/footer.json";
import {
  type DropdownSection,
  type NavButton,
  type Pool,
  POOLS,
  ROWS,
  TEX,
  VARIANT_NAME,
  WAVE_SHADES,
  follow,
  makeTexture,
  noise,
  pick,
  surfaceTexture,
} from "./navbar";
import "./footer.css";

interface Social {
  name: string;
  icon: string;
  color: string;
  white: boolean;
  url: string;
}

// Links + columns are shared with the nav (single source of truth).
const buttons = navData.buttons as NavButton[];
const dropdown = navData.dropdown as DropdownSection[];
const socials = footerData.socials as Social[];

// The footer is a cross-section: the variant's surface material on top (socials),
// a 1-cell transition strip, then its underground material below (links).
const BODY_POOL: Record<string, Pool> = {
  grass: POOLS.stone,
  snow: POOLS.ice,
  sand: POOLS.sand, // sand bed; water is drawn over it
  jungle: POOLS.nightMud,
};
// 1-cell seam between the two materials: a 50/50 mix (sand stays full sand).
const SEAM: Record<string, [Pool, Pool]> = {
  grass: [POOLS.dirt, POOLS.stone],
  snow: [POOLS.ice, POOLS.snow],
  sand: [POOLS.sand, POOLS.sand],
  jungle: [POOLS.jungleDirt, POOLS.nightMud],
};
const IS_WATER = VARIANT_NAME === "sand";
const CELL = 8; // px per texture pixel, matching the navbar grid

// 1-row mixed strip used as the seam between the surface and the underground.
function seamTexture([a, b]: [Pool, Pool]): string {
  const canvas = document.createElement("canvas");
  canvas.width = TEX;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  for (let x = 0; x < TEX; x++) {
    ctx.fillStyle =
      noise(x, 0, 51) < 0.5 ? pick(a, noise(x, 0, 53)) : pick(b, noise(x, 0, 53));
    ctx.fillRect(x, 0, 1, 1);
  }
  return `url(${canvas.toDataURL()})`;
}

// Water in the sand body, matching the navbar tide (fills up to ~95%).
const W_AMP = 0.9;
const W_FREQ = 0.22;
const W_SPEED = 0.004;

// Social icon pngs from src/assets/socials by filename.
const ICONS = import.meta.glob("../assets/socials/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const iconUrl = (name: string) =>
  Object.entries(ICONS).find(([p]) => p.endsWith(`/${name}`))?.[1] ?? "";

function texStyle(pool: Pool) {
  return {
    backgroundColor: pool[0].color,
    backgroundImage: makeTexture(pool),
    backgroundSize: `${TEX * CELL}px ${TEX * CELL}px`,
  };
}

export default function Footer() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);

  // Animate the body water (sand variant only) - same banded tide as the navbar.
  useEffect(() => {
    if (!IS_WATER) return;
    const body = bodyRef.current;
    const canvas = waterRef.current;
    const ctx = canvas?.getContext("2d");
    if (!body || !canvas || !ctx) return;
    let raf = 0;
    const t0 = performance.now();
    const last = WAVE_SHADES.length - 1;
    const draw = (now: number) => {
      const t = now - t0;
      const rect = body.getBoundingClientRect();
      const cols = Math.max(1, Math.ceil(rect.width / CELL));
      const rows = Math.max(1, Math.ceil(rect.height / CELL));
      if (canvas.width !== cols || canvas.height !== rows) {
        canvas.width = cols;
        canvas.height = rows;
      }
      ctx.clearRect(0, 0, cols, rows);
      const sandTop = rows * 0.05; // water fills ~95%, sand showing on top
      for (let col = 0; col < cols; col++) {
        const wob =
          W_AMP * Math.sin(col * W_FREQ + t * W_SPEED) +
          0.5 * W_AMP * Math.sin(col * W_FREQ * 2 - t * W_SPEED * 1.7);
        const s = sandTop + wob;
        let prev = Math.max(0, Math.ceil(s));
        for (let k = 0; k <= last; k++) {
          const raw = k === last ? rows : Math.ceil(s + k + 1);
          const next = Math.min(rows, Math.max(prev, raw));
          if (next > prev) {
            ctx.fillStyle = WAVE_SHADES[k];
            ctx.fillRect(col, prev, 1, next - prev);
          }
          prev = next;
        }
        const foam =
          Math.sin(col * W_FREQ * 0.9 - t * W_SPEED * 2.4) +
          Math.sin(col * W_FREQ * 2.3 + t * W_SPEED * 1.1);
        const fy = Math.round(s);
        if (foam > 1.15 && fy >= 0 && fy < rows) {
          ctx.fillStyle = WAVE_SHADES[0];
          ctx.fillRect(col, fy, 1, 1);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const className = ["footer", `footer--${VARIANT_NAME}`].join(" ");

  return (
    <footer className={className} id="site-footer">
      <div
        className="footer__top"
        style={{
          height: `${ROWS * CELL}px`,
          backgroundImage: surfaceTexture(VARIANT_NAME),
          backgroundSize: `${TEX * CELL}px ${ROWS * CELL}px`,
        }}
      >
        <div className="footer__socials">
          {socials.map((s) => (
            <a
              className="footer__social"
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.name}
              style={{ background: s.color }}
            >
              <img
                src={iconUrl(s.icon)}
                alt={s.name}
                style={s.white ? { filter: "brightness(0) invert(1)" } : undefined}
              />
            </a>
          ))}
        </div>
      </div>

      <div
        className="footer__seam"
        aria-hidden="true"
        style={{
          height: `${CELL}px`,
          backgroundImage: seamTexture(SEAM[VARIANT_NAME] ?? SEAM.grass),
          backgroundSize: `${TEX * CELL}px ${CELL}px`,
        }}
      />

      <div
        className="footer__body"
        ref={bodyRef}
        style={texStyle(BODY_POOL[VARIANT_NAME] ?? POOLS.stone)}
      >
        {IS_WATER && (
          <canvas className="footer__water" ref={waterRef} aria-hidden="true" />
        )}

        <div className="footer__columns">
          <div className="footer__column">
            <span className="footer__col-header">Links</span>
            {buttons.map((item) => (
              <button
                className="footer__link"
                key={item.name}
                onClick={() => follow(item)}
              >
                {item.name}
              </button>
            ))}
          </div>

          {dropdown.map((section, i) => (
            <div className="footer__column" key={section.header ?? i}>
              {section.header && (
                <span className="footer__col-header">{section.header}</span>
              )}
              {section.items.map((sub) => (
                <button
                  className="footer__link"
                  key={sub.name}
                  onClick={() => follow(sub)}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="footer__legal">
          <p>Copyright © Zeronia 2026. All rights reserved.</p>
          <p>
            Minecraft was created by Mojang. Zeronia is an official{" "}
            <a
              className="footer__legal-link"
              href="https://www.minecraft.net/en-us/article/realms-page-content-creator"
              target="_blank"
              rel="noopener noreferrer"
            >
              Minecraft Java Realms Content Creator
            </a>
            , but not endorsed by or affiliated with Mojang.
          </p>
        </div>
      </div>
    </footer>
  );
}
