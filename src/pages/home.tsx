import "./home.css";

export default function HomePage() {
  return (
    <main className="home">
      {/* TEMP: gives the page height so the navbar's scroll behaviour is testable */}
      <p className="home__scroll-test">scroll down ↓</p>
      <p className="home__scroll-test home__scroll-test--bottom">
        you scrolled — check the navbar ↑
      </p>
    </main>
  );
}
