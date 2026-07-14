import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import JSZip from "jszip";
import { frameStyle } from "../frame";
import { useMediaQuery } from "../../../lib/use-media-query";
import sortUpUrl from "../../../assets/sprites/sort_up.png";
import sortDownUrl from "../../../assets/sprites/sort_down.png";
import unsortedUrl from "../../../assets/sprites/unsorted.png";
import downloadUrl from "../../../assets/sprites/download.png";
import "./versions.css";

interface VersionEntry {
  version: string;
  mcVersions: string[];
  files: Record<string, string>;
}

const PAGE_SIZE = 10;
const TYPE_ORDER = ["datapack", "resourcepack", "world"];
const TYPE_LABELS: Record<string, string> = {
  datapack: "Datapack",
  resourcepack: "Resource Pack",
  world: "World",
};

const typeLabel = (t: string) => TYPE_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1);

const compareVersions = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true });

function sortedMc(list: string[]) {
  return [...list].sort(compareVersions);
}

function mcRange(list: string[]) {
  if (list.length === 0) return "";
  const sorted = sortedMc(list);
  return sorted.length === 1 ? sorted[0] : `${sorted[0]} - ${sorted[sorted.length - 1]}`;
}

function fileName(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() || "download.zip");
  } catch {
    return url.split("/").pop() || "download.zip";
  }
}

function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function openAll(urls: string[]) {
  for (const url of urls) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.click();
  }
}

export default function Versions({
  title,
  slug,
  versions = [],
}: {
  title?: string;
  slug?: string;
  versions?: VersionEntry[];
}) {
  const isMobile = useMediaQuery("(max-width: 40rem)");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bundling, setBundling] = useState<Set<string>>(new Set());
  const filterRef = useRef<HTMLDivElement>(null);

  const fileTypes = useMemo(() => {
    const found = new Set<string>();
    for (const v of versions) for (const t of Object.keys(v.files ?? {})) found.add(t);
    return [...found].sort((a, b) => {
      const ia = TYPE_ORDER.indexOf(a);
      const ib = TYPE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [versions]);

  const visibleTypes = fileTypes.filter((t) => !hiddenTypes.has(t));

  useEffect(() => {
    if (!filterOpen) return;
    const close = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [filterOpen]);

  const latestVersion = useMemo(
    () =>
      versions.length === 0
        ? null
        : versions.reduce(
            (latest, v) => (compareVersions(v.version, latest) > 0 ? v.version : latest),
            versions[0].version,
          ),
    [versions],
  );

  const rows = useMemo(() => {
    const q = query.toLowerCase();
    const out = versions.filter(
      (v) =>
        !q ||
        v.version.toLowerCase().includes(q) ||
        v.mcVersions.some((mc) => mc.toLowerCase().includes(q)) ||
        mcRange(v.mcVersions).toLowerCase().includes(q),
    );
    if (!sort) return out;
    const { key, dir } = sort;
    return [...out].sort((a, b) => {
      if (key === "version") return dir * compareVersions(a.version, b.version);
      const ma = sortedMc(a.mcVersions).pop() ?? "";
      const mb = sortedMc(b.mcVersions).pop() ?? "";
      return dir * compareVersions(ma, mb);
    });
  }, [versions, sort, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  const toggleType = (t: string) =>
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

  const availableUrls = (v: VersionEntry) =>
    fileTypes.map((t) => v.files?.[t]).filter((u): u is string => Boolean(u));

  async function downloadBundle(v: VersionEntry) {
    const urls = availableUrls(v);
    if (urls.length === 0 || bundling.has(v.version)) return;
    setBundling((prev) => new Set(prev).add(v.version));
    try {
      const zip = new JSZip();
      await Promise.all(
        urls.map(async (url) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${res.status} for ${url}`);
          zip.file(fileName(url), await res.blob());
        }),
      );
      const blob = await zip.generateAsync({ type: "blob" });
      saveBlob(blob, `${slug ?? "download"}-v${v.version}-all.zip`);
    } catch {
      openAll(urls);
    } finally {
      setBundling((prev) => {
        const next = new Set(prev);
        next.delete(v.version);
        return next;
      });
    }
  }

  const sortArrow = (key: string) => (
    <img
      className="versions__sort"
      src={sort?.key !== key ? unsortedUrl : sort.dir === 1 ? sortUpUrl : sortDownUrl}
      alt={sort?.key !== key ? "unsorted" : sort.dir === 1 ? "ascending" : "descending"}
    />
  );

  const dlIcon = <img className="versions__dl-icon" src={downloadUrl} alt="" />;

  const dlButton = (url: string | undefined, label = "Download") =>
    url ? (
      <a
        className="mc-button versions__dl versions__dl--available"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {dlIcon}
        {label}
      </a>
    ) : (
      <span className="mc-button versions__dl mc-button--disabled">
        {dlIcon}
        {label}
      </span>
    );

  const heading = <h2 className="section__title">{isMobile ? "Download" : title}</h2>;

  if (versions.length === 0)
    return (
      <>
        {heading}
        <p className="versions__empty">No versions listed yet.</p>
      </>
    );

  if (isMobile) {
    const latest =
      versions.find((v) => v.version === latestVersion) ?? versions[0];
    return (
      <>
        {heading}
        <div className="versions versions--mobile">
          <p className="versions__mobile-label">
            Download Latest Release ({latest.version})
          </p>
          {fileTypes
            .filter((t) => latest.files?.[t])
            .map((t) => (
              <a
                key={t}
                className="mc-button versions__dl versions__dl--available"
                href={latest.files[t]}
                target="_blank"
                rel="noreferrer"
              >
                <img className="versions__dl-icon" src={downloadUrl} alt="" />
                {typeLabel(t)}
              </a>
            ))}
          <p className="versions__mobile-note">For all releases, please view on desktop.</p>
        </div>
      </>
    );
  }

  const gridStyle = {
    ...frameStyle(),
    "--versions-cols": `1.1fr 0.9fr repeat(${visibleTypes.length}, 1.1fr) 5rem`,
  } as CSSProperties;

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
          <div className="versions__filter" ref={filterRef}>
            <button
              className="versions__filter-toggle"
              onClick={() => setFilterOpen((o) => !o)}
            >
              {hiddenTypes.size === 0
                ? "All types"
                : `${visibleTypes.length}/${fileTypes.length} types`}
            </button>
            {filterOpen && (
              <div className="versions__filter-menu">
                {fileTypes.map((t) => (
                  <label key={t} className="versions__filter-option">
                    <input
                      type="checkbox"
                      checked={!hiddenTypes.has(t)}
                      onChange={() => toggleType(t)}
                    />
                    {typeLabel(t)}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        {visibleTypes.length === 0 ? (
          <p className="versions__empty">
            Please select a file type to show the available versions
          </p>
        ) : (
        <div className="versions__table pixel-frame" style={gridStyle}>
          <div className="versions__row versions__row--head">
            <button className="versions__head" onClick={() => toggleSort("mcVersion")}>
              MC Version
              {sortArrow("mcVersion")}
            </button>
            <button className="versions__head" onClick={() => toggleSort("version")}>
              Version
              {sortArrow("version")}
            </button>
            {visibleTypes.map((t) => (
              <span key={t} className="versions__head versions__head--static">
                {typeLabel(t)}
              </span>
            ))}
            <span className="versions__head versions__head--static">All</span>
          </div>
          {visible.map((v) => (
            <div key={v.version} className="versions__row">
              <span title={sortedMc(v.mcVersions).join(", ")}>{mcRange(v.mcVersions)}</span>
              <span>{v.version}</span>
              {visibleTypes.map((t) => (
                <span key={t} className="versions__cell">
                  {dlButton(v.files?.[t])}
                </span>
              ))}
              <span className="versions__action">
                {availableUrls(v).length > 0 ? (
                  <button
                    className={`mc-button versions__dl versions__dl--available${
                      bundling.has(v.version) ? " mc-button--disabled" : ""
                    }`}
                    onClick={() => downloadBundle(v)}
                  >
                    {dlIcon}
                    {bundling.has(v.version) ? "…" : ".zip"}
                  </button>
                ) : (
                  <span className="mc-button versions__dl mc-button--disabled">
                    {dlIcon}
                    .zip
                  </span>
                )}
              </span>
            </div>
          ))}
          {visible.length === 0 && <p className="versions__empty">No matching versions</p>}
        </div>
        )}
        {visibleTypes.length > 0 && pages > 1 && (
          <div className="versions__pager">
            <button
              className="mc-button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
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
