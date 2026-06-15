import { useEffect, useState } from "react";
import "./home.css";

const TAGLINE = "Coming Soon...";
const START_DELAY = 500; // wait before typing begins
const TYPE_DURATION = 1500; // total time to type the full tagline

export default function HomePage() {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const step = TYPE_DURATION / TAGLINE.length;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        for (let i = 1; i <= TAGLINE.length; i++) {
          timers.push(
            window.setTimeout(() => setTyped(TAGLINE.slice(0, i)), step * i),
          );
        }
      }, START_DELAY),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <main className="home">
      <img
        className="home__logo"
        src="/assets/zeronia-logo-white.svg"
        alt="Zeronia"
      />
      <p className="home__tagline">
        {typed}
        <span className="home__caret" aria-hidden="true" />
      </p>
    </main>
  );
}
