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
  youtube?: string;
  button?: { label: string; href: string };
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

const youtubeId = (url?: string) =>
  url?.match(/(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1];

const mediaUrl = (item: NewsItem) =>
  youtubeId(item.youtube)
    ? `https://img.youtube.com/vi/${youtubeId(item.youtube)}/maxresdefault.jpg`
    : imageUrl(item.image);

function youtubeFrame(item: NewsItem) {
  const id = youtubeId(item.youtube);
  return id ? (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      title={`${item.title} video`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  ) : null;
}

function NewsMedia({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  if (featured && youtubeId(item.youtube)) {
    return <div className="news__featured-media news__featured-media--video">{youtubeFrame(item)}</div>;
  }
  return (
    <button
      className="news__featured-media"
      onClick={() => undefined}
      aria-label={`Open ${item.title}`}
    >
      <img src={mediaUrl(item)} alt={item.title} />
    </button>
  );
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function descriptionParts(text: string) {
  const parts = text.split(/(\[head:\s*[^\]]+\]|\[[^\]]+\]\(https?:\/\/[^)]+\)|https?:\/\/\S+)/g);
  return parts.map((part, i) => {
    const head = part.match(/^\[head:\s*([^\]]+)\]$/i);
    if (head) {
      return (
        <img
          key={i}
          className="news__head"
          src={`https://mc-heads.net/avatar/${encodeURIComponent(head[1])}/32`}
          alt={head[1]}
          title={head[1]}
          width={24}
          height={24}
        />
      );
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return <a key={i} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    }
    if (/^https?:\/\//.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noreferrer">{part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

function NewsDescription({ item }: { item: NewsItem }) {
  return (
    <>
      <p className="news__desc">{descriptionParts(item.description)}</p>
      {item.button && <a className="mc-button news__button" href={item.button.href}>{item.button.label}</a>}
    </>
  );
}

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
        {youtubeId(featured.youtube) ? (
          <NewsMedia item={featured} featured />
        ) : (
          <button
            className="news__featured-media"
            onClick={() => setActive(featured)}
            aria-label={`Open ${featured.title}`}
          >
            <img src={mediaUrl(featured)} alt={featured.title} />
          </button>
        )}
        <div className="news__featured-meta">
          <h3 className="news__title">
            <span>{featured.title}</span>
            <span className="news__date">{formatDate(featured.date)}</span>
          </h3>
          <NewsDescription item={featured} />
        </div>
      </article>

      {shown.length > 0 && (
        <div className="news__grid">
          {shown.map((item, i) => {
            const isLast = i === shown.length - 1;
            return (
              <div className="news__card-wrap" key={`${item.title}-${item.date}`}>
                <button className="news__card" onClick={() => setActive(item)}>
                  <img src={mediaUrl(item)} alt={item.title} />
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
              {youtubeId(active.youtube) ? (
                <div className="news__modal-video">{youtubeFrame(active)}</div>
              ) : (
                <img src={mediaUrl(active)} alt={active.title} />
              )}
              <h3 className="news__title">
                <span>{active.title}</span>
                <span className="news__date">{formatDate(active.date)}</span>
              </h3>
              <NewsDescription item={active} />
            </div>
          </div>,
          document.body,
        )}
    </Section>
  );
}
