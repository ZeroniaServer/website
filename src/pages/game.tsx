import navData from "../data/navbar/navbar.json";
import { DEEPSLATE, fieldStyle } from "../components/sections/section";
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
  const name = NAMES[slug] ?? titleize(slug);
  return (
    <main className="game-page" style={fieldStyle(DEEPSLATE)}>
      <h1 className="game-page__title">{name}</h1>
      <p className="game-page__soon">Coming soon…</p>
    </main>
  );
}
