import { frameStyle } from "../frame";
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

export default function Trailer({ videos = [] }: { videos?: TrailerVideo[] }) {
  if (videos.length === 0) return null;
  return (
    <div className="trailer">
      {videos.map((v, i) => {
        const id = v.url ? youtubeId(v.url) : "";
        return (
          <figure key={i} className="trailer__item">
            {v.title && <figcaption className="trailer__label">{v.title}</figcaption>}
            <div className="trailer__frame pixel-frame" style={frameStyle()}>
              {v.html ? (
                <div className="trailer__embed" dangerouslySetInnerHTML={{ __html: v.html }} />
              ) : id ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}`}
                  title={v.title || "Trailer"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : null}
            </div>
          </figure>
        );
      })}
    </div>
  );
}
