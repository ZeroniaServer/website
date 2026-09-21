import { goToPage } from "../lib/router";
import { DEEPSLATE, fieldStyle } from "./sections/section";
import "../pages/game.css";
import "./404.css";

export default function NotFound({ slug }: { slug: string }) {
  return <main className="game-page not-found" style={fieldStyle(DEEPSLATE)}><div className="not-found__heading"><p className="not-found__code">404</p><h1 className="game-page__title">Chunk Not Found</h1></div><p className="game-page__soon">No page at <code>/{slug}</code></p><button className="mc-button" onClick={() => goToPage("/")}>Return Home</button></main>;
}
