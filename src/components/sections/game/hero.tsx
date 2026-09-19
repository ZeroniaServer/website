import { useRef, useState } from "react";
import { gameAsset } from "../../../lib/games";
import CustomMarkdown, { markdownToText } from "../../custom-markdown";
import McmetaImg from "../../mcmeta-img";
import { buttonStyle, frameStyle } from "../frame";
import arrowUrl from "../../../assets/sprites/arrow_down.png";
import globeUrl from "../../../assets/sprites/globe.png";
import hamburgerUrl from "../../../assets/sprites/hamburger.png";
import cubekrowdLogoUrl from "../../../assets/sprites/cubekrowd_full.png";
import "./hero.css";

interface Credit {
  player: string;
  roles: string[];
}

interface CreditGroups {
  primary?: Credit[];
  secondary?: Credit[];
  translators?: Credit[];
}

interface Server {
  name: string;
  url: string;
  color?: string;
}

interface HeroProps {
  slug: string;
  gameName: string;
  media?: { type: "image" | "video"; src: string; thumbnail?: string };
  logo?: string;
  color?: string;
  description?: string;
  version?: string;
  download?: { color?: string };
  servers?: Server[];
  credits?: CreditGroups;
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
  credits = {},
  creditsLink,
  versionsId,
}: HeroProps) {
  const mediaSrc = media?.src ? gameAsset(slug, media.src) : "";
  const thumbnailSrc = media?.thumbnail ? gameAsset(slug, media.thumbnail) : "";
  const logoSrc = logo ? gameAsset(slug, logo) : "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showAllCredits, setShowAllCredits] = useState(false);

  const primaryCredits = credits.primary ?? [];
  const secondaryCredits = credits.secondary ?? [];
  const translatorCredits = credits.translators ?? [];
  const hasCredits = primaryCredits.length > 0 || secondaryCredits.length > 0 || translatorCredits.length > 0;

  const renderCredit = (c: Credit) => (
    <li key={c.player} className="hero__credit" tabIndex={0}>
      <img src={headUrl(c.player)} alt={c.player} loading="lazy" width={40} height={40} />
      <span className="hero__credit-tip pixel-frame">
        <strong>{c.player}</strong>
        <CustomMarkdown text={c.roles.join(", ")} slug={slug} inline />
      </span>
    </li>
  );

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const scrollToVersions = () =>
    versionsId &&
    document.getElementById(versionsId)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="hero">
      {mediaSrc && (
        <div className="hero__media pixel-frame" style={frameStyle(color)}>
          {media?.type === "video" ? (
            <video
              ref={videoRef}
              className="hero__bg"
              src={mediaSrc}
              poster={thumbnailSrc || undefined}
              autoPlay
              muted
              playsInline
              onClick={replay}
            />
          ) : (
            <McmetaImg className="hero__bg" src={mediaSrc} alt={markdownToText(gameName)} />
          )}
          {logoSrc && <McmetaImg className="hero__logo" src={logoSrc} alt={markdownToText(gameName)} />}
        </div>
      )}
      <div className="hero__row">
        <div className="hero__title-group">
          <h1 className="hero__title">
            <CustomMarkdown text={gameName} slug={slug} inline />
          </h1>
          {version && (
            <span className="hero__version-chip">
              <CustomMarkdown text={version} slug={slug} inline />
            </span>
          )}
        </div>
        {hasCredits && (
          <ul className="hero__credits">
            {primaryCredits.map(renderCredit)}
            {secondaryCredits.length > 0 ? (
              <>
                {!showAllCredits && (
                  <li className="hero__credit hero__credit--more" tabIndex={0}>
                    <button
                      type="button"
                      className="hero__more-btn"
                      aria-label="Show More"
                      onClick={() => setShowAllCredits(true)}
                    >
                      <img src={hamburgerUrl} alt="" width={40} height={40} />
                    </button>
                    <span className="hero__credit-tip pixel-frame">Show More</span>
                  </li>
                )}
                {showAllCredits && secondaryCredits.map(renderCredit)}
                {showAllCredits && translatorCredits.map(renderCredit)}
              </>
            ) : (
              <>
                {!showAllCredits && translatorCredits.length > 0 && (
                  <li className="hero__credit hero__credit--globe" tabIndex={0}>
                    <button
                      type="button"
                      className="hero__globe-btn"
                      aria-label="Show Translators"
                      onClick={() => setShowAllCredits(true)}
                    >
                      <img src={globeUrl} alt="" width={40} height={40} />
                    </button>
                    <span className="hero__credit-tip pixel-frame">Show Translators</span>
                  </li>
                )}
                {showAllCredits && translatorCredits.map(renderCredit)}
              </>
            )}
          </ul>
        )}
      </div>
      {description && (
        <p className="hero__desc">
          <CustomMarkdown text={description} slug={slug} inline />
        </p>
      )}
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
              className={`mc-button${s.name.trim().toLowerCase() === "cubekrowd" ? " hero__server-button--cubekrowd" : ""}`}
              style={buttonStyle(s.color)}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {s.name.trim().toLowerCase() === "cubekrowd" ? (
                <img className="hero__server-logo" src={cubekrowdLogoUrl} alt={s.name} />
              ) : (
                <CustomMarkdown text={s.name} slug={slug} inline />
              )}
            </a>
          ) : (
            <span
              key={s.name}
              className={`mc-button mc-button--disabled${s.name.trim().toLowerCase() === "cubekrowd" ? " hero__server-button--cubekrowd" : ""}`}
              style={buttonStyle(s.color)}
            >
              {s.name.trim().toLowerCase() === "cubekrowd" ? (
                <img className="hero__server-logo" src={cubekrowdLogoUrl} alt={s.name} />
              ) : (
                <CustomMarkdown text={s.name} slug={slug} inline />
              )}
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
