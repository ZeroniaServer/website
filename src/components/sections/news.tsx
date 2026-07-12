import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { type Pool } from "../navbar";
import newsData from "../../data/news/news.json";
import Section from "./section";
import "./news.css";

interface NewsItem {
  title: string;
  date: string;
  description: string;
  image: string;
}

export const background = newsData.background as Pool;

const INITIAL = 3;
const STEP = 9;

const IMAGES = import.meta.glob("../../assets/news/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const imageUrl = (name: string) =>
  Object.entries(IMAGES).find(([p]) => p.endsWith(`/${name}`))?.[1] ?? "";

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function News() {
  const items = useMemo(
    () =>
      (newsData.items as NewsItem[])
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );
  const [featured, ...rest] = items;
  const [visible, setVisible] = useState(() =>
    window.matchMedia("(max-width: 40rem)").matches ? 2 : INITIAL,
  );
  const [active, setActive] = useState<NewsItem | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (!featured) return null;

  const shown = rest.slice(0, visible);
  const hasMore = rest.length > visible;

  return (
    <Section id="news" pool={background} className="news">
      <article className="news__featured">
        <button
          className="news__featured-media"
          onClick={() => setActive(featured)}
          aria-label={`Open ${featured.title}`}
        >
          <img src={imageUrl(featured.image)} alt={featured.title} />
        </button>
        <div className="news__featured-meta">
          <h3 className="news__title">
            <span>{featured.title}</span>
            <span className="news__date">{formatDate(featured.date)}</span>
          </h3>
          <p className="news__desc">{featured.description}</p>
        </div>
      </article>

      {shown.length > 0 && (
        <div className="news__grid">
          {shown.map((item, i) => {
            const isLast = i === shown.length - 1;
            return (
              <div className="news__card-wrap" key={`${item.title}-${item.date}`}>
                <button className="news__card" onClick={() => setActive(item)}>
                  <img src={imageUrl(item.image)} alt={item.title} />
                  <span className="news__card-title">{item.title}</span>
                </button>
                {isLast && hasMore && (
                  <div className="news__more-overlay">
                    <button
                      className="mc-button news__more"
                      onClick={() => setVisible((v) => v + STEP)}
                    >
                      View more
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {active &&
        createPortal(
          <div className="news__modal" onClick={() => setActive(null)}>
            <div className="news__modal-panel" onClick={(e) => e.stopPropagation()}>
              <button
                className="news__modal-close"
                onClick={() => setActive(null)}
                aria-label="Close"
              >
                ×
              </button>
              <img src={imageUrl(active.image)} alt={active.title} />
              <h3 className="news__title">
                <span>{active.title}</span>
                <span className="news__date">{formatDate(active.date)}</span>
              </h3>
              <p className="news__desc">{active.description}</p>
            </div>
          </div>,
          document.body,
        )}
    </Section>
  );
}
