import { useMemo, useState } from "react";
import { frameStyle } from "../frame";
import { useMediaQuery } from "../../../lib/use-media-query";
import arrowUrl from "../../../assets/sprites/arrow_down.png";
import "./versions.css";

interface VersionEntry {
  name: string;
  version: string;
  gameVersion: string;
  url: string;
  type: string;
}

type SortKey = "name" | "version" | "gameVersion" | "type";

const PAGE_SIZE = 10;
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "version", label: "Version" },
  { key: "gameVersion", label: "Game Version" },
  { key: "type", label: "Type" },
];

export default function Versions({
  title,
  versions = [],
}: {
  title?: string;
  versions?: VersionEntry[];
}) {
  const isMobile = useMediaQuery("(max-width: 40rem)");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [gvFilter, setGvFilter] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const types = useMemo(
    () => [...new Set(versions.map((v) => v.type).filter(Boolean))],
    [versions],
  );
  const gameVersions = useMemo(
    () => [...new Set(versions.map((v) => v.gameVersion).filter(Boolean))],
    [versions],
  );

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const out = versions.filter(
      (v) =>
        (!typeFilter || v.type === typeFilter) &&
        (!gvFilter || v.gameVersion === gvFilter) &&
        (!q || `${v.name} ${v.version}`.toLowerCase().includes(q)),
    );
    if (!sort) return out;
    return [...out].sort(
      (a, b) => sort.dir * a[sort.key].localeCompare(b[sort.key], undefined, { numeric: true }),
    );
  }, [versions, sort, typeFilter, gvFilter, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  const heading = <h2 className="section__title">{isMobile ? "Download" : title}</h2>;

  if (versions.length === 0)
    return (
      <>
        {heading}
        <p className="versions__empty">No versions listed yet.</p>
      </>
    );

  if (isMobile) {
    const latest = versions[0];
    return (
      <>
        {heading}
        <div className="versions versions--mobile">
          <p className="versions__mobile-label">Download Latest Release ({latest.version})</p>
          {latest.url ? (
            <a className="mc-button versions__dl" href={latest.url} target="_blank" rel="noreferrer">
              {latest.name}
            </a>
          ) : (
            <span className="mc-button versions__dl mc-button--disabled">{latest.name}</span>
          )}
          <p className="versions__mobile-note">For all releases, please view on desktop.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {heading}
      <div className="versions">
      <div className="versions__controls">
        <input
          className="versions__search"
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={gvFilter}
          onChange={(e) => {
            setGvFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="">All game versions</option>
          {gameVersions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="versions__table pixel-frame" style={frameStyle()}>
        <div className="versions__row versions__row--head">
          {COLUMNS.map((c) => (
            <button key={c.key} className="versions__head" onClick={() => toggleSort(c.key)}>
              {c.label}
              {sort?.key === c.key && (
                <img
                  className={`versions__sort${sort.dir === 1 ? " versions__sort--asc" : ""}`}
                  src={arrowUrl}
                  alt={sort.dir === 1 ? "ascending" : "descending"}
                />
              )}
            </button>
          ))}
          <span />
        </div>
        {visible.map((v, i) => (
          <div key={`${v.name}-${v.version}-${i}`} className="versions__row">
            <span className="versions__name">{v.name}</span>
            <span>{v.version}</span>
            <span>{v.gameVersion}</span>
            <span>{v.type && <span className="versions__type">{v.type}</span>}</span>
            <span className="versions__action">
              {v.url ? (
                <a className="mc-button versions__dl" href={v.url} target="_blank" rel="noreferrer">
                  Download
                </a>
              ) : (
                <span className="mc-button versions__dl mc-button--disabled">Download</span>
              )}
            </span>
          </div>
        ))}
        {visible.length === 0 && <p className="versions__empty">No matching versions</p>}
      </div>
      {pages > 1 && (
        <div className="versions__pager">
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
    </>
  );
}
