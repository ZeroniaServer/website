import { Fragment, useEffect } from "react";
import navData from "../data/navbar/navbar.json";
import { type Pool } from "../components/navbar";
import Section, { DEEPSLATE, DEEPSLATE_LIGHT, Seam, fieldStyle } from "../components/sections/section";
import { SECTIONS } from "../components/sections/game/registry";
import Missing from "../components/sections/game/missing";
import { getGame } from "../lib/games";
import "./game.css";

const NAMES: Record<string, string> = {};
for (const section of navData.dropdown)
  for (const item of section.items)
    NAMES[item.route.replace(/^\//, "")] = item.name;

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export default function GamePage({ slug }: { slug: string }) {
  const game = getGame(slug);

  useEffect(() => {
    document.title = game ? `${game.name} | Zeronia` : "Zeronia";
  }, [game]);

  if (!game) {
    const name = NAMES[slug] ?? titleize(slug);
    return (
      <main className="game-page" style={fieldStyle(DEEPSLATE)}>
        <h1 className="game-page__title">{name}</h1>
        <p className="game-page__soon">Coming soon…</p>
      </main>
    );
  }

  const pools = game.sections.map(
    (s, i) => (s.background as Pool | undefined) ?? (i % 2 ? DEEPSLATE_LIGHT : DEEPSLATE),
  );
  const versionsIndex = game.sections.findIndex((s) => s.type === "versions");
  const versionsId = versionsIndex >= 0 ? `versions-${versionsIndex}` : undefined;

  return (
    <main className="game">
      {game.sections.map((s, i) => {
        const { type, background, title, ...props } = s;
        void background;
        const Cmp = SECTIONS[type];
        const ownsHeader = type === "hero" || type === "faq";
        const extra = type === "hero" ? { versionsId } : type === "faq" ? { title } : {};
        return (
          <Fragment key={`${type}-${i}`}>
            {i > 0 && <Seam above={pools[i - 1]} below={pools[i]} />}
            <Section
              id={`${type}-${i}`}
              pool={pools[i]}
              title={ownsHeader ? undefined : title}
              className={`game__section game__section--${type}`}
            >
              {Cmp ? (
                <Cmp slug={slug} gameName={game.name} {...props} {...extra} />
              ) : (
                <Missing type={type} />
              )}
            </Section>
          </Fragment>
        );
      })}
    </main>
  );
}
