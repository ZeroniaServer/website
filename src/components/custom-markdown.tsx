import { Fragment, type ReactNode } from "react";
import { gameAsset } from "../lib/games";
import "./custom-markdown.css";

// Bold: **text** or __text__
// Italic: *text* or _text_
// Underline: ++text++
// Link: [label](https://example.com)
// Image: ![alt](images/example.png)
// Head/skull: [head: Player] or [skull: Player]
// Game icon: [icon: icons/example.png]

const TOKEN_RE =
  /!\[[^\]]*\]\([^)]+\)|\[(?:head|skull):\s*[^\]]+\]|\[icon:\s*[^\]]+\]|\[[^\]]+\]\([^)]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|\+\+[^+\n]+\+\+|(?<!\w)\*[^*\n]+\*(?!\w)|(?<!\w)_[^_\n]+_(?!\w)|https?:\/\/[^\s<]+/gi;

const EXTERNAL_RE = /^https?:\/\//i;
const SAFE_RELATIVE_RE = /^(?:\/(?!\/)|#|\.{0,2}\/|[^/:?#]+(?:\/|$))/;

function safeTarget(value: string): string | null {
  const target = value.trim();
  if (EXTERNAL_RE.test(target) || /^mailto:/i.test(target) || SAFE_RELATIVE_RE.test(target))
    return target;
  return null;
}

function trimUrlPunctuation(value: string): [string, string] {
  const match = value.match(/^(.*?)([.,!?;:]*)$/);
  return [match?.[1] ?? value, match?.[2] ?? ""];
}

type AssetResolver = (path: string) => string;

function imageSource(source: string, slug?: string, resolveAsset?: AssetResolver): string {
  const safe = safeTarget(source);
  if (!safe) return "";
  if (/^mailto:/i.test(safe) || safe.startsWith("#")) return "";
  if (EXTERNAL_RE.test(safe) || safe.startsWith("/")) return safe;
  if (resolveAsset) return resolveAsset(safe) || safe;
  return slug ? gameAsset(slug, safe) || safe : safe;
}

function linkNode(
  label: string,
  href: string,
  key: string,
  slug?: string,
  parseLabel = true,
  resolveAsset?: AssetResolver,
): ReactNode {
  const safe = safeTarget(href);
  if (!safe) return `[${label}](${href})`;
  const external = EXTERNAL_RE.test(safe);
  return (
    <a
      key={key}
      className="custom-markdown__link"
      href={safe}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {parseLabel ? parseInline(label, slug, `${key}-label`, resolveAsset) : label}
    </a>
  );
}

function tokenNode(
  token: string,
  slug: string | undefined,
  key: string,
  resolveAsset?: AssetResolver,
): ReactNode {
  const image = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (image) {
    const src = imageSource(image[2], slug, resolveAsset);
    return src ? (
      <img key={key} className="custom-markdown__image" src={src} alt={image[1]} loading="lazy" />
    ) : (
      token
    );
  }

  const head = token.match(/^\[(?:head|skull):\s*([^\]]+)\]$/i);
  if (head) {
    const player = head[1].trim();
    return (
      <img
        key={key}
        className="custom-markdown__head"
        src={`https://mc-heads.net/avatar/${encodeURIComponent(player)}/32`}
        alt={player}
        title={player}
        width={24}
        height={24}
        loading="lazy"
      />
    );
  }

  const icon = token.match(/^\[icon:\s*([^\]]+)\]$/i);
  if (icon) {
    const src = imageSource(icon[1], slug, resolveAsset);
    return src ? <img key={key} className="custom-markdown__icon" src={src} alt="" /> : token;
  }

  const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (link) return linkNode(link[1], link[2], key, slug, true, resolveAsset);

  if (token.startsWith("**") || token.startsWith("__"))
    return (
      <strong key={key}>
        {parseInline(token.slice(2, -2), slug, `${key}-strong`, resolveAsset)}
      </strong>
    );

  if (token.startsWith("++"))
    return (
      <u key={key}>
        {parseInline(token.slice(2, -2), slug, `${key}-underline`, resolveAsset)}
      </u>
    );

  if (token.startsWith("*") || token.startsWith("_"))
    return (
      <em key={key}>
        {parseInline(token.slice(1, -1), slug, `${key}-em`, resolveAsset)}
      </em>
    );

  if (EXTERNAL_RE.test(token)) {
    const [href, punctuation] = trimUrlPunctuation(token);
    return (
      <Fragment key={key}>
        {linkNode(href, href, `${key}-url`, slug, false, resolveAsset)}
        {punctuation}
      </Fragment>
    );
  }

  return token;
}

export function parseInline(
  text: string,
  slug?: string,
  keyPrefix = "md",
  resolveAsset?: AssetResolver,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenRe = new RegExp(TOKEN_RE.source, TOKEN_RE.flags);
  let last = 0;
  let index = 0;

  for (let match = tokenRe.exec(text); match; match = tokenRe.exec(text)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(tokenNode(match[0], slug, `${keyPrefix}-${index++}`, resolveAsset));
    last = match.index + match[0].length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function markdownToText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[(?:head|skull):\s*([^\]]+)\]/gi, "$1")
    .replace(/\[icon:\s*[^\]]+\]/gi, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__|\+\+)(.*?)\1/g, "$2")
    .replace(/([*_])([^*_\n]+)\1/g, "$2");
}

export default function CustomMarkdown({
  text,
  slug,
  inline = false,
  className,
  resolveAsset,
}: {
  text: string;
  slug?: string;
  inline?: boolean;
  className?: string;
  resolveAsset?: AssetResolver;
}) {
  if (!text) return null;
  if (inline) return <>{parseInline(text, slug, "inline", resolveAsset)}</>;

  return (
    <div className={["custom-markdown", className].filter(Boolean).join(" ")}>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((paragraph, i) => (
          <p key={i}>{parseInline(paragraph, slug, `paragraph-${i}`, resolveAsset)}</p>
        ))}
    </div>
  );
}
