import { useState } from "react";
import { frameStyle } from "../frame";
import CustomMarkdown, { markdownToText } from "../../custom-markdown";
import "./trailer.css";

interface TrailerVideo {
  title?: string;
  url?: string;
  html?: string;
}

function youtubeId(url: string): string {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : "";
}

function TrailerFrame({
  slug,
  video,
  autoplay,
}: {
  slug?: string;
  video: TrailerVideo;
  autoplay?: boolean;
}) {
  const id = video.url ? youtubeId(video.url) : "";
  return (
    <figure className="trailer__item">
      {video.title && (
        <figcaption className="trailer__label">
          <CustomMarkdown text={video.title} slug={slug} inline />
        </figcaption>
      )}
      <div className="trailer__frame pixel-frame" style={frameStyle()}>
        {video.html ? (
          <div className="trailer__embed" dangerouslySetInnerHTML={{ __html: video.html }} />
        ) : id ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?modestbranding=1&rel=0&iv_load_policy=3${autoplay ? "&autoplay=1" : ""}`}
            title={markdownToText(video.title || "Trailer")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : null}
      </div>
    </figure>
  );
}

export default function Trailer({
  slug,
  videos = [],
}: {
  slug?: string;
  videos?: TrailerVideo[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  if (videos.length === 0) return null;

  if (videos.length === 1) {
    return (
      <div className="trailer">
        <TrailerFrame slug={slug} video={videos[0]} />
      </div>
    );
  }

  const active = videos[activeIndex] || videos[0];

  return (
    <div className="trailer trailer--multi">
      <TrailerFrame key={activeIndex} slug={slug} video={active} autoplay={autoplay} />
      <div className="trailer__thumbs">
        {videos.map((v, i) => {
          const id = v.url ? youtubeId(v.url) : "";
          const isActive = i === activeIndex;
          return (
            <button
              key={i}
              type="button"
              className={`trailer__thumb${isActive ? " trailer__thumb--active" : ""}`}
              onClick={() => {
                setActiveIndex(i);
                setAutoplay(true);
              }}
              aria-current={isActive}
              aria-label={v.title ? `Play ${markdownToText(v.title)}` : `Play video ${i + 1}`}
            >
              <span className="trailer__thumb-inner">
                {id ? (
                  <img
                    src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <span className="trailer__thumb-placeholder" />
                )}
                {!isActive && (
                  <span className="trailer__thumb-play" aria-hidden="true">
                    <span className="trailer__thumb-play-circle">
                      <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
