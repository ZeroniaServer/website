import { useEffect, useMemo, useRef, useState } from "react";
import Paragraphs from "../../paragraphs";
import { frameStyle } from "../frame";
import "./faq.css";

interface FaqEntry {
  question: string;
  answer: string;
  pinned?: boolean;
}

const PAGE_SIZE = 8;

function AnswerPanel({ open, text, slug }: { open: boolean; text: string; slug: string }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const measure = () => setHeight(open && innerRef.current ? innerRef.current.scrollHeight : 0);
    measure();
    if (!open) return;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, text]);

  return (
    <div className="faq__answer-wrap" style={{ height }}>
      <div className="faq__answer" ref={innerRef}>
        <Paragraphs text={text} slug={slug} />
      </div>
    </div>
  );
}

export default function Faq({
  slug,
  title,
  faqs = [],
}: {
  slug: string;
  title?: string;
  faqs?: FaqEntry[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const items = useMemo(() => {
    const q = query.toLowerCase();
    const match = (f: FaqEntry) => !q || `${f.question} ${f.answer}`.toLowerCase().includes(q);
    const pinned = faqs.filter((f) => f.pinned && match(f));
    const rest = faqs
      .filter((f) => !f.pinned && match(f))
      .sort((a, b) => a.question.localeCompare(b.question));
    return [...pinned, ...rest];
  }, [faqs, query]);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = items.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  // A search that narrows to one result found only in the answer (not
  // visible in the collapsed question) auto-opens that result; leaving
  // that state auto-closes whichever one we opened.
  const autoOpened = useRef<string | null>(null);
  useEffect(() => {
    const q = query.toLowerCase();
    const only = items.length === 1 ? items[0] : null;
    const answerOnlyMatch =
      q && only && only.answer.toLowerCase().includes(q) && !only.question.toLowerCase().includes(q);

    if (answerOnlyMatch) {
      autoOpened.current = only.question;
      setOpen((o) => ({ ...o, [only.question]: true }));
    } else if (autoOpened.current) {
      const key = autoOpened.current;
      setOpen((o) => ({ ...o, [key]: false }));
      autoOpened.current = null;
    }
  }, [query, items]);

  if (faqs.length === 0) return null;
  return (
    <div className="faq">
      <div className="faq__header">
        {title && <h2 className="section__title faq__title">{title}</h2>}
        <input
          className="faq__search"
          type="search"
          placeholder="Search questions"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
      </div>
      <div className="faq__list">
        {visible.map((f) => (
          <div key={f.question} className="faq__item pixel-frame" style={frameStyle()}>
            <button
              className="faq__question"
              aria-expanded={!!open[f.question]}
              onClick={() => setOpen((o) => ({ ...o, [f.question]: !o[f.question] }))}
            >
              {f.pinned && (
                <span className="faq__pin" title="Pinned">
                  ★
                </span>
              )}
              <span className="faq__question-text">{f.question}</span>
              <span className="faq__toggle" aria-hidden="true" />
            </button>
            <AnswerPanel open={!!open[f.question]} text={f.answer} slug={slug} />
          </div>
        ))}
        {visible.length === 0 && <p className="faq__empty">No matching questions</p>}
      </div>
      {pages > 1 && (
        <div className="faq__pager">
          <button className="mc-button" disabled={current === 0} onClick={() => setPage(current - 1)}>
            Prev
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            className="mc-button"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
