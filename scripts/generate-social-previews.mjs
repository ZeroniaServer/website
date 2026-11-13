import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const site = "https://zeronia.org";
const description = "Zeronia creates free Minecraft maps for friends, communities, and Realms.";
const template = readFileSync("dist/index.html", "utf8");
const games = [
  ["rocket-riders", "Rocket Riders", "rocket-riders.png", "rr"],
  ["snowy-skirmish-2", "Snowy Skirmish 2", "snowy-skirmish-2.png", "ss"],
  ["crafty-cannoneers", "Crafty Cannoneers", "crafty-cannoneers.png", "cc"],
  ["the-purple", "The Purple", "the-purple.png", "purple"],
  ["fossil-frights", "Fossil Frights", "fossil-frights.png", "ff"],
];

function setMeta(html, key, value, attribute = "property") {
  return html.replace(new RegExp(`(<meta ${attribute}="${key}" content=")[^"]*(")`), `$1${value}$2`);
}

function gamePage(slug, name, image) {
  const title = `${name} | Zeronia`;
  const url = `${site}/${slug}`;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  for (const [key, value, attribute] of [
    ["og:title", title], ["og:description", description], ["og:type", "article"],
    ["og:url", url], ["og:image", `${site}/og/${image}`],
    ["twitter:title", title, "name"], ["twitter:description", description, "name"],
    ["twitter:image", `${site}/og/${image}`, "name"],
  ]) html = setMeta(html, key, value, attribute);
  return html;
}

for (const [slug, name, image, alias] of games) {
  const html = gamePage(slug, name, image);
  for (const route of [slug, alias]) {
    const file = join("dist", route, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
    writeFileSync(join("dist", `${route}.html`), html);
  }
}
