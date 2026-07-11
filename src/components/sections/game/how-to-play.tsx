import { useEffect, useRef, useState } from "react";
import { gameAsset } from "../../../lib/games";
import Paragraphs from "../../paragraphs";
import "./how-to-play.css";

interface Category {
  name: string;
  icon?: string;
  body: string;
}

const idFor = (name: string, i: number) =>
  `htp-${i}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;

// choose most colour icon colour for bar colour
function dominantColor(img: HTMLImageElement): string | null {
  const size = Math.min(img.naturalWidth || 16, 64);
  if (!size) return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, size, size, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const counts = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue; // skip transparent pixels
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts)
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  return best ? `rgb(${best})` : null;
}

export default function HowToPlay({
  slug,
  intro = "",
  categories = [],
}: {
  slug: string;
  intro?: string;
  categories?: Category[];
}) {
  const [active, setActive] = useState(0);
  const [dominant, setDominant] = useState<Record<number, string>>({});
  const layoutRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const suppressObserver = useRef(false);
  const suppressTimer = useRef<number | undefined>(undefined);

  // keep the current category highlighted
  useEffect(() => {
    const blocks = bodyRef.current?.querySelectorAll(".htp__category");
    if (!blocks?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return;
        for (const e of entries)
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    blocks.forEach((b) => observer.observe(b));
    return () => observer.disconnect();
  }, [categories.length]);

  //  keep the rail vertically centered in the viewport
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const layout = layoutRef.current;
      const rail = railRef.current;
      if (!layout || !rail) return;
      if (window.matchMedia("(max-width: 40rem)").matches) {
        rail.style.transform = "";
        return;
      }
      const layoutRect = layout.getBoundingClientRect();
      const railHeight = rail.offsetHeight;
      const raw = window.innerHeight / 2 - railHeight / 2 - layoutRect.top;
      const clamped = Math.max(0, Math.min(raw, layoutRect.height - railHeight));
      rail.style.transform = `translateY(${clamped}px)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [categories.length]);

  useEffect(() => () => window.clearTimeout(suppressTimer.current), []);

  // choose thumb colour based on dominant item colour
  useEffect(() => {
    let cancelled = false;
    categories.forEach((c, i) => {
      const url = c.icon ? gameAsset(slug, c.icon) : "";
      if (!url) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        const color = dominantColor(img);
        if (color) setDominant((d) => (d[i] === color ? d : { ...d, [i]: color }));
      };
      img.src = url;
    });
    return () => {
      cancelled = true;
    };
  }, [categories, slug]);

  if (categories.length === 0 && !intro) return null;

  if (categories.length === 0)
    return (
      <div className="htp">
        <Paragraphs className="htp__intro" text={intro} slug={slug} />
      </div>
    );

  const scrollToIndex = (i: number) => {
    setActive(i);
    suppressObserver.current = true;
    window.clearTimeout(suppressTimer.current);
    suppressTimer.current = window.setTimeout(() => {
      suppressObserver.current = false;
    }, 1000);

    const heading = document
      .getElementById(idFor(categories[i].name, i))
      ?.querySelector(".htp__heading");
    const icon = iconRefs.current[i];
    if (heading && icon) {
      const headingRect = heading.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const delta =
        headingRect.top + headingRect.height / 2 - (iconRect.top + iconRect.height / 2);
      window.scrollBy({ top: delta, behavior: "smooth" });
    } else {
      document
        .getElementById(idFor(categories[i].name, i))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const thumbPercent = 100 / categories.length;
  const thumbTop =
    categories.length > 1 ? (active / (categories.length - 1)) * (100 - thumbPercent) : 0;

  return (
    <div className="htp">
      {intro && <Paragraphs className="htp__intro" text={intro} slug={slug} />}
      <div className="htp__layout" ref={layoutRef}>
        <nav className="htp__rail" aria-label="How to play categories" ref={railRef}>
          <div className="htp__rail-scrollbar" aria-hidden="true">
            <div
              className="htp__rail-thumb"
              style={{
                height: `${thumbPercent}%`,
                top: `${thumbTop}%`,
                background: dominant[active],
              }}
            />
          </div>
          <div className="htp__rail-icons">
            {categories.map((c, i) => {
              const icon = c.icon ? gameAsset(slug, c.icon) : "";
              return (
                <button
                  key={i}
                  ref={(el) => {
                    iconRefs.current[i] = el;
                  }}
                  className={`htp__rail-icon${active === i ? " htp__rail-icon--active" : ""}`}
                  title={c.name}
                  onClick={() => scrollToIndex(i)}
                >
                  {icon ? <img src={icon} alt={c.name} /> : <span>{c.name.charAt(0)}</span>}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="htp__body" ref={bodyRef}>
          {categories.map((c, i) => {
            const icon = c.icon ? gameAsset(slug, c.icon) : "";
            return (
              <div key={i} id={idFor(c.name, i)} data-index={i} className="htp__category">
                <h3 className="htp__heading">
                  {icon && <img className="htp__heading-icon" src={icon} alt="" />}
                  {c.name}
                </h3>
                <Paragraphs text={c.body} slug={slug} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
