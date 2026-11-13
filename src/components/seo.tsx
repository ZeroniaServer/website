import { useEffect } from "react";
import { getGame } from "../lib/games";
import { markdownToText } from "./custom-markdown";

const SITE = "https://zeronia.org";
const DEFAULT_DESCRIPTION =
  "Zeronia creates free Minecraft maps for friends, communities, and Realms.";

function setMeta(name: string, content: string) {
  const selector = `meta[name="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function Seo({ slug, notFound = false }: { slug: string; notFound?: boolean }) {
  const game = slug ? getGame(slug) : undefined;
  useEffect(() => {
    const name = game ? markdownToText(game.name) : "Zeronia";
    const hero = game?.sections.find((section) => section.type === "hero");
    const version = typeof hero?.version === "string" ? hero.version : "";
    const title = game ? `${name} | Zeronia` : "Zeronia | Minecraft Minigames & Maps";
    const description = DEFAULT_DESCRIPTION;
    const url = `${SITE}${game ? `/${slug}` : "/"}`;
    document.title = title;
    setMeta("description", description);
    setMeta("robots", notFound ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    setCanonical(url);

    const graph: Record<string, unknown>[] = [
      { "@type": "Organization", "@id": `${SITE}/#organization`, name: "Zeronia", url: SITE, logo: `${SITE}/src/assets/logo/icon-512.png` },
      { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Zeronia", url: SITE, publisher: { "@id": `${SITE}/#organization` } },
    ];
    if (game) graph.push({ "@type": "VideoGame", name, url, description, ...(version ? { softwareVersion: version } : {}), gamePlatform: "Minecraft: Java Edition", applicationCategory: "Game", author: { "@id": `${SITE}/#organization` } });
    let script = document.head.querySelector<HTMLScriptElement>('script[data-zeronia-schema]');
    if (!script) { script = document.createElement("script"); script.type = "application/ld+json"; script.dataset.zeroniaSchema = "true"; document.head.appendChild(script); }
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  }, [game, notFound, slug]);
  return null;
}
