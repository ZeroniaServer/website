import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { type Pool } from "../navbar";
import CustomMarkdown, { markdownToText } from "../custom-markdown";
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
      title={`${markdownToText(item.title)} video`}
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
      aria-label={`Open ${markdownToText(item.title)}`}
    >
      <img src={mediaUrl(item)} alt={markdownToText(item.title)} />
    </button>
  );
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function NewsDescription({ item }: { item: NewsItem }) {
  return (
    <>
      <p className="news__desc">
        <CustomMarkdown text={item.description} resolveAsset={imageUrl} inline />
      </p>
      {item.button && (
        <a className="mc-button news__button" href={item.button.href}>
          <CustomMarkdown text={item.button.label} resolveAsset={imageUrl} inline />
        </a>
      )}
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
            aria-label={`Open ${markdownToText(featured.title)}`}
          >
            <img src={mediaUrl(featured)} alt={markdownToText(featured.title)} />
          </button>
        )}
        <div className="news__featured-meta">
          <h3 className="news__title">
            <span><CustomMarkdown text={featured.title} resolveAsset={imageUrl} inline /></span>
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
                <div
                  className="news__card"
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a")) return;
                    setActive(item);
                  }}
                  onKeyDown={(event) => {
                    if ((event.target as HTMLElement).closest("a")) return;
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setActive(item);
                  }}
                >
                  <img src={mediaUrl(item)} alt={markdownToText(item.title)} />
                  <span className="news__card-title">
                    <CustomMarkdown text={item.title} resolveAsset={imageUrl} inline />
                  </span>
                </div>
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
                <img src={mediaUrl(active)} alt={markdownToText(active.title)} />
              )}
              <h3 className="news__title">
                <span><CustomMarkdown text={active.title} resolveAsset={imageUrl} inline /></span>
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
