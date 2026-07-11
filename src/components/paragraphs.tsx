import { gameAsset } from "../lib/games";
import "./paragraphs.css";

const ICON_RE = /\[icon:([^\]]+)\]/g;

function renderInline(text: string, slug?: string) {
  if (!slug || !text.includes("[icon:")) return text;
  const nodes: (string | JSX.Element)[] = [];
  let last = 0;
  let key = 0;
  ICON_RE.lastIndex = 0;
  for (let match = ICON_RE.exec(text); match; match = ICON_RE.exec(text)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const src = gameAsset(slug, match[1].trim());
    if (src) nodes.push(<img key={key++} className="paragraphs__icon" src={src} alt="" />);
    last = match.index + match[0].length;
  }
  nodes.push(text.slice(last));
  return nodes;
}

export default function Paragraphs({
  text,
  slug,
  className,
}: {
  text: string;
  slug?: string;
  className?: string;
}) {
  if (!text) return null;
  return (
    <div className={["paragraphs", className].filter(Boolean).join(" ")}>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{renderInline(p, slug)}</p>
        ))}
    </div>
  );
}
