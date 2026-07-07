import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { gameAsset } from "../../../lib/games";
import { frameStyle } from "../frame";
import "./gallery.css";

interface GalleryImage {
  src: string;
  caption?: string;
}

export default function Gallery({
  slug,
  images = [],
}: {
  slug: string;
  images?: GalleryImage[];
}) {
  const [active, setActive] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (images.length === 0) return null;
  return (
    <div className="gallery">
      {images.map((img, i) => {
        const url = img.src ? gameAsset(slug, img.src) : "";
        return (
          <figure key={i} className="gallery__item pixel-frame" style={frameStyle()}>
            <button
              className="gallery__media"
              onClick={() => url && setActive(img)}
              aria-label={img.caption ? `Open ${img.caption}` : "Open image"}
            >
              {url && <img src={url} alt={img.caption || ""} loading="lazy" />}
            </button>
            {img.caption && <figcaption className="gallery__caption">{img.caption}</figcaption>}
          </figure>
        );
      })}
      {active &&
        createPortal(
          <div className="gallery__modal" onClick={() => setActive(null)}>
            <div className="gallery__modal-panel" onClick={(e) => e.stopPropagation()}>
              <button
                className="gallery__modal-close"
                onClick={() => setActive(null)}
                aria-label="Close"
              >
                ×
              </button>
              <img src={gameAsset(slug, active.src)} alt={active.caption || ""} />
              {active.caption && <p className="gallery__modal-caption">{active.caption}</p>}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
