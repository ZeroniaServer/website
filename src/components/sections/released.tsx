import { useEffect, useRef, useState } from "react";
import { type Pool } from "../navbar";
import { goToPage } from "../../lib/router";
import releasedData from "../../data/released/released.json";
import Section from "./section";
import "./released.css";

interface Media {
  type: "image" | "video";
  src: string;
}

interface Game {
  name: string;
  route: string;
  description: string;
  logo?: string;
  color?: string;
  media: Media;
}

export const background = releasedData.background as Pool;

const ASSETS = import.meta.glob("../../assets/released/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const assetUrl = (name: string) =>
  Object.entries(ASSETS).find(([p]) => p.endsWith(`/${name}`))?.[1] ?? "";

function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const ch = (i: number) => parseInt(h.slice(i, i + 2), 16);
  const mix = (c: number) => (amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  const hx = (c: number) =>
    Math.max(0, Math.min(255, Math.round(mix(c)))).toString(16).padStart(2, "0");
  return `#${hx(ch(0))}${hx(ch(2))}${hx(ch(4))}`;
}

function frameStyle(color = "#ffffff") {
  const light = shade(color, 0.4);
  const dark = shade(color, -0.4);
  return {
    borderTopColor: light,
    borderLeftColor: light,
    borderRightColor: dark,
    borderBottomColor: dark,
  };
}

export default function Released() {
  const games = releasedData.games as unknown as Game[];
  const [active, setActive] = useState<number | null>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
  }, [active]);

  return (
    <Section id="released" pool={background} title="Games" className="released">
      <div className="released__list" onMouseLeave={() => setActive(null)}>
        {games.map((game, i) => (
          <div
            className={`released__row${active === i ? " released__row--open" : ""}`}
            key={game.name}
            role="link"
            tabIndex={0}
            style={frameStyle(game.color)}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => goToPage(game.route)}
            onKeyDown={(e) => e.key === "Enter" && goToPage(game.route)}
          >
            <div className="released__media">
              {game.media.type === "video" ? (
                <video
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  src={assetUrl(game.media.src)}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={assetUrl(game.media.src)} alt={game.name} />
              )}
            </div>
            <div className="released__overlay">
              {game.logo ? (
                <img
                  className="released__logo"
                  src={assetUrl(game.logo)}
                  alt={game.name}
                />
              ) : (
                <span className="released__name">{game.name}</span>
              )}
              <p className="released__blurb">{game.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
