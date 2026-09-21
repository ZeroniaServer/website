import { readFileSync, writeFileSync } from "node:fs";

const navbar = JSON.parse(readFileSync("src/data/navbar/navbar.json", "utf8"));
const slugs = [...new Set(navbar.dropdown.flatMap((group) => group.items.map((item) => item.route.replace(/^\//, ""))))];
const released = new Set(navbar.dropdown[0]?.items.map((item) => item.route.replace(/^\//, "")) ?? []);
const urls = ["", ...slugs];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((slug) => `  <url><loc>https://zeronia.org/${slug}</loc></url>`).join("\n")}
</urlset>
`;

const nameBySlug = new Map(navbar.dropdown.flatMap((group) => group.items).map((item) => [item.route.replace(/^\//, ""), item.name]));
const gameLinks = slugs.filter((slug) => released.has(slug)).map((slug) => `- [${nameBySlug.get(slug) ?? slug}](https://zeronia.org/${slug})`).join("\n");
const llms = `# Zeronia

> Zeronia creates free Minecraft: Java Edition minigames and multiplayer maps.

Zeronia is a Minecraft Realms partner founded in 2017. The site contains official game information, how-to-play guides, FAQs, galleries, news, and downloads for Zeronia maps.

## Released game pages

${gameLinks}

Use each game page as the canonical source for its current description, supported Minecraft version, downloads, and gameplay instructions.
`;

writeFileSync("public/sitemap.xml", sitemap);
writeFileSync("public/llms.txt", llms);
