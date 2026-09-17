import { useEffect, useMemo, useRef, useState } from "react";
import CustomMarkdown from "../../custom-markdown";
import { frameStyle } from "../frame";
import { gameAssetIfExists } from "../../../lib/games";
import { toSmallCaps } from "../../../lib/text";
import pinnedIcon from "../../../assets/sprites/pinned.png";
import "./faq.css";

interface FaqEntry {
  question: string;
  answer: string;
  pinned?: boolean;
  tags?: string[];
}

const PAGE_SIZE = 8;

const tagLabel = (tag: string) =>
  tag
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function FaqTags({ slug, faq }: { slug: string; faq: FaqEntry }) {
  const tags = [
    ...(faq.pinned ? ["pinned"] : []),
    ...(Array.isArray(faq.tags) ? faq.tags.filter((tag): tag is string => typeof tag === "string") : []),
  ].filter((tag, index, all) => {
    const normalized = tag.trim().toLowerCase();
    return normalized && all.findIndex((candidate) => candidate.trim().toLowerCase() === normalized) === index;
  });

  return (
    <span className="faq__tags" aria-label="FAQ tags">
      {tags.map((tag) => {
        const normalized = tag.trim();
        const isPinned = normalized.toLowerCase() === "pinned";
        const icon = isPinned ? pinnedIcon : gameAssetIfExists(slug, `faq/${normalized}.png`);
        const label = isPinned ? "Pinned" : tagLabel(normalized);
        return (
          <span className="faq__tag" key={normalized.toLowerCase()} title={label}>
            {icon && <img className="faq__tag-icon" src={icon} alt="" />}
            <span className="faq__tag-label">{toSmallCaps(label)}</span>
          </span>
        );
      })}
    </span>
  );
}

function AnswerPanel({ open, text, slug }: { open: boolean; text: string; slug: string }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const measure = () => setHeight(open && innerRef.current ? innerRef.current.scrollHeight : 0);
    measure();
    if (!open) return;
    const observer = new ResizeObserver(measure);
    if (innerRef.current) observer.observe(innerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open, text]);

  return (
    <div className="faq__answer-wrap" style={{ height }}>
      <div className="faq__answer" ref={innerRef}>
        <CustomMarkdown text={text} slug={slug} />
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
  const [hiddenTags, setHiddenTags] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const tagOptions = useMemo(() => {
    const found = new Map<string, string>();
    for (const faq of faqs) {
      if (!Array.isArray(faq.tags)) continue;
      for (const tag of faq.tags) {
        if (typeof tag !== "string") continue;
        const value = tag.trim();
        const key = value.toLowerCase();
        if (value && key !== "pinned" && !found.has(key)) found.set(key, value);
      }
    }
    return [...found.values()].sort((a, b) => tagLabel(a).localeCompare(tagLabel(b)));
  }, [faqs]);

  useEffect(() => {
    if (!filterOpen) return;
    const close = (event: MouseEvent) => {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filterOpen]);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    const match = (f: FaqEntry) => {
      const matchesQuery = !q || `${f.question} ${f.answer}`.toLowerCase().includes(q);
      const matchesTags = !tagOptions.some(
        (tag) =>
          hiddenTags.has(tag.toLowerCase()) &&
          Array.isArray(f.tags) &&
          f.tags.some((value) => typeof value === "string" && value.trim().toLowerCase() === tag.toLowerCase()),
      );
      return matchesQuery && matchesTags;
    };
    const pinned = faqs.filter((f) => f.pinned && match(f));
    const rest = faqs
      .filter((f) => !f.pinned && match(f))
      .sort((a, b) => a.question.localeCompare(b.question));
    return [...pinned, ...rest];
  }, [faqs, hiddenTags, query, tagOptions]);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = items.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleTag = (tag: string) => {
    setHiddenTags((previous) => {
      const next = new Set(previous);
      const key = tag.toLowerCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPage(0);
  };

  // auto open if search is one result
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
        {title && (
          <h2 className="section__title faq__title">
            <CustomMarkdown text={title} slug={slug} inline />
          </h2>
        )}
        <div className="faq__controls">
          {tagOptions.length > 0 && (
            <div className="faq__filter" ref={filterRef}>
              <button
                className="faq__filter-toggle"
                onClick={() => setFilterOpen((isOpen) => !isOpen)}
                aria-expanded={filterOpen}
              >
                {hiddenTags.size === 0 ? "All tags" : `${tagOptions.length - hiddenTags.size}/${tagOptions.length} tags`}
              </button>
              {filterOpen && (
                <div className="faq__filter-menu">
                  {tagOptions.map((tag) => (
                    <label key={tag.toLowerCase()} className="faq__filter-option">
                      <input
                        type="checkbox"
                        checked={!hiddenTags.has(tag.toLowerCase())}
                        onChange={() => toggleTag(tag)}
                      />
                      {toSmallCaps(tagLabel(tag))}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
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
      </div>
      <div className="faq__list">
        {visible.map((f) => (
          <div key={f.question} className="faq__item pixel-frame" style={frameStyle()}>
            <div
              className="faq__question"
              role="button"
              tabIndex={0}
              aria-expanded={!!open[f.question]}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) return;
                setOpen((o) => ({ ...o, [f.question]: !o[f.question] }));
              }}
              onKeyDown={(event) => {
                if ((event.target as HTMLElement).closest("a")) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setOpen((o) => ({ ...o, [f.question]: !o[f.question] }));
              }}
            >
              <span className="faq__question-text">
                <CustomMarkdown text={f.question} slug={slug} inline />
              </span>
              <FaqTags slug={slug} faq={f} />
              <span className="faq__toggle" aria-hidden="true" />
            </div>
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
