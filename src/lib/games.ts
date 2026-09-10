export interface GameSection {
  type: string;
  background?: { color: string; weight: number }[];
  title?: string;
  [key: string]: unknown;
}

export interface GameData {
  name: string;
  aliases?: string[];
  navbarVariant?: string | string[];
  sections: GameSection[];
}

// Game data
const MODULES = import.meta.glob("../data/games/*/*.json", {
  eager: true,
  import: "default",
}) as Record<string, GameData>;

export const GAMES: Record<string, GameData> = {};
const ALIASES: Record<string, string> = {};

for (const [path, data] of Object.entries(MODULES)) {
  const parts = path.split("/");
  const slug = parts[parts.length - 2] ?? "";
  if (!slug || slug === "template") continue;
  GAMES[slug] = data;
  for (const alias of data.aliases ?? []) ALIASES[alias.toLowerCase()] = slug;
}

export function resolveSlug(raw: string): string {
  const slug = raw.toLowerCase();
  return ALIASES[slug] ?? slug;
}

export function getGame(slug: string): GameData | undefined {
  return GAMES[slug];
}

const ASSETS = import.meta.glob("../assets/games/**/*", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const ASSET_METADATA = import.meta.glob("../assets/games/**/*.png.mcmeta", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const METADATA_BY_ASSET = new Map<string, string>();
for (const [metadataPath, metadata] of Object.entries(ASSET_METADATA)) {
  METADATA_BY_ASSET.set(metadataPath.slice(0, -".mcmeta".length), metadata);
}

// Game asset
export function gameAsset(slug: string, relPath: string): string {
  if (!relPath) return "";
  const suffix = `/games/${slug}/${relPath}`;
  for (const [path, url] of Object.entries(ASSETS))
    if (path.endsWith(suffix)) return url;
  if (import.meta.env.DEV) console.warn(`Missing game asset: ${suffix}`);
  return "";
}

// Asset metadata
export function gameAssetMetadata(url: string): string | undefined {
  const assetPath = Object.entries(ASSETS).find(([, assetUrl]) => assetUrl === url)?.[0];
  return assetPath ? METADATA_BY_ASSET.get(assetPath) : undefined;
}
