import "./paragraphs.css";

// Plain text, not markdown: split on blank lines into paragraphs and let CSS
// (white-space: pre-line) preserve any single line breaks within each.
export default function Paragraphs({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={["paragraphs", className].filter(Boolean).join(" ")}>
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}
