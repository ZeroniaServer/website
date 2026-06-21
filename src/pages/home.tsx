import { useEffect } from "react";
import { consumePendingScroll } from "../lib/router";
import { Seam } from "../components/sections/section";
import News, { background as newsBg } from "../components/sections/news";
import Released, { background as releasedBg } from "../components/sections/released";
import Team, { background as teamBg } from "../components/sections/team";
import About, { background as aboutBg } from "../components/sections/about";
import "./home.css";

export default function HomePage() {
  useEffect(consumePendingScroll, []);

  return (
    <main className="home">
      <News />
      <Seam above={newsBg} below={releasedBg} />
      <Released />
      <Seam above={releasedBg} below={teamBg} />
      <Team />
      <Seam above={teamBg} below={aboutBg} />
      <About />
    </main>
  );
}
