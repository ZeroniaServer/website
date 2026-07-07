import { gameAsset } from "../../../lib/games";
import { buttonStyle, frameStyle } from "../frame";
import arrowUrl from "../../../assets/sprites/arrow_down.png";
import "./hero.css";

interface Credit {
  player: string;
  roles: string[];
}

interface Server {
  name: string;
  url: string;
  color?: string;
}

interface HeroProps {
  slug: string;
  gameName: string;
  media?: { type: "image" | "video"; src: string };
  logo?: string;
  color?: string;
  description?: string;
  version?: string;
  download?: { color?: string };
  servers?: Server[];
  credits?: Credit[];
  creditsLink?: string;
  versionsId?: string;
}

const headUrl = (name: string) =>
  `https://mc-heads.net/avatar/${encodeURIComponent(name)}/96`;

export default function Hero({
  slug,
  gameName,
  media,
  logo,
  color,
  description,
  version,
  download,
  servers = [],
  credits = [],
  creditsLink,
  versionsId,
}: HeroProps) {
  const mediaSrc = media?.src ? gameAsset(slug, media.src) : "";
  const logoSrc = logo ? gameAsset(slug, logo) : "";

  const scrollToVersions = () =>
    versionsId &&
    document.getElementById(versionsId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="hero">
      {mediaSrc && (
        <div className="hero__media pixel-frame" style={frameStyle(color)}>
          {media?.type === "video" ? (
            <video className="hero__bg" src={mediaSrc} autoPlay muted loop playsInline />
          ) : (
            <img className="hero__bg" src={mediaSrc} alt={gameName} />
          )}
          {logoSrc && <img className="hero__logo" src={logoSrc} alt={gameName} />}
        </div>
      )}
      <div className="hero__row">
        <div className="hero__title-group">
          <h1 className="hero__title">{gameName}</h1>
          {version && <span className="hero__version-chip">{version}</span>}
        </div>
        {credits.length > 0 && (
          <ul className="hero__credits">
            {credits.map((c) => (
              <li key={c.player} className="hero__credit" tabIndex={0}>
                <img
                  src={headUrl(c.player)}
                  alt={c.player}
                  loading="lazy"
                  width={40}
                  height={40}
                />
                <span className="hero__credit-tip pixel-frame">
                  <strong>{c.player}</strong>
                  {c.roles.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {description && <p className="hero__desc">{description}</p>}
      <div className="hero__buttons">
        <button
          className="mc-button hero__download"
          style={buttonStyle(download?.color)}
          onClick={scrollToVersions}
        >
          <img className="hero__download-icon" src={arrowUrl} alt="" />
          Download
        </button>
        {servers.map((s) =>
          s.url ? (
            <a
              key={s.name}
              className="mc-button"
              style={buttonStyle(s.color)}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.name}
            </a>
          ) : (
            <span
              key={s.name}
              className="mc-button mc-button--disabled"
              style={buttonStyle(s.color)}
            >
              {s.name}
            </span>
          ),
        )}
      </div>
      {creditsLink && (
        <a className="hero__credits-link" href={creditsLink} target="_blank" rel="noreferrer">
          Full credits
        </a>
      )}
    </div>
  );
}
