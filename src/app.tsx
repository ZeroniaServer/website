import React from "react";
import ReactDOM from "react-dom/client";
import "./app.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import HomePage from "./pages/home";
import GamePage from "./pages/game";
import { useRoute } from "./lib/router";
import { getGame } from "./lib/games";
import navData from "./data/navbar/navbar.json";
import Seo from "./components/seo";
import NotFound from "./components/404";

const listedSlugs = new Set(navData.dropdown.flatMap((group) => group.items.map((item) => item.route.replace(/^\//, ""))));

function App() {
  const slug = useRoute();
  const isUnknown = Boolean(slug) && !getGame(slug) && !listedSlugs.has(slug);
  return (
    <>
      <Seo slug={slug} notFound={isUnknown} />
      <Navbar />
      {isUnknown ? <NotFound slug={slug} /> : slug ? <GamePage slug={slug} /> : <HomePage />}
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
