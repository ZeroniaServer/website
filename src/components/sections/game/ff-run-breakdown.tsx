import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { gameAsset } from "../../../lib/games";
import McmetaImg from "../../mcmeta-img";
import arrowUrl from "../../../assets/sprites/arrow_down.png";
import trophyUrl from "../../../assets/games/fossil-frights/run_breakdown/trophy.png";
import { formatTicks, parseRun, readRunToken, recipientName, recipientStocking, taskIcon, type Run, type RunEvent } from "./run-breakdown-data";
import "./ff-run-breakdown.css";

const STORAGE_KEY = "ff-run-breakdowns";
const COIN_URL = gameAsset("fossil-frights", "icons/dinocoin.png");
const STATIC_COIN_URL = gameAsset("fossil-frights", "icons/dinocoin_static.png");
const FRIGHTMAS_HAT_URL = gameAsset("fossil-frights", "run_breakdown/frightmas/frightmas_hat.png");
type HistoryEntry = { token: string; cachedAt: number };
const savedRuns = (): HistoryEntry[] => { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(value) ? value.map((entry, index) => typeof entry === "string" ? { token: entry, cachedAt: index } : entry).filter((entry) => entry?.token) : []; } catch { return []; } };
const pointStyle = (ticks: number, duration: number, bounds?: { left: number; right: number }) => ({ "--at": `${(ticks / duration) * 100}%`, ...(bounds ? { "--hit-left": `${bounds.left}%`, "--hit-right": `${bounds.right}%` } : {}) } as CSSProperties);
type Tip = { event: RunEvent; icon?: string; secondaryIcon?: string; detail?: string };
const MOBILE_CHART_HEIGHT_REM = 78;
const MOBILE_LABEL_HEIGHT_REM = 1.34;

function mobileLabelOffsets(events: RunEvent[], duration: number) {
  const offsets = new Map<RunEvent, number>();
  const hiddenDays = new Set<RunEvent>();
  const groups: RunEvent[][] = [];
  let group: RunEvent[] = [];
  let previousBottom = Number.NEGATIVE_INFINITY;

  events.forEach((event) => {
    const originalTop = event.ticks / duration * MOBILE_CHART_HEIGHT_REM - MOBILE_LABEL_HEIGHT_REM;
    if (originalTop >= previousBottom && group.length) {
      groups.push(group);
      group = [];
    }
    const placedTop = Math.max(originalTop, previousBottom);
    offsets.set(event, placedTop - originalTop);
    previousBottom = placedTop + MOBILE_LABEL_HEIGHT_REM;
    group.push(event);
  });
  if (group.length) groups.push(group);
  groups.filter((items) => items.length >= 4).forEach((items) => items.filter((event) => event.kind === "day").forEach((event) => hiddenDays.add(event)));
  let visiblePreviousBottom = Number.NEGATIVE_INFINITY;
  events.forEach((event) => {
    if (hiddenDays.has(event)) return;
    const originalTop = event.ticks / duration * MOBILE_CHART_HEIGHT_REM - MOBILE_LABEL_HEIGHT_REM;
    const placedTop = Math.max(originalTop, visiblePreviousBottom);
    offsets.set(event, placedTop - originalTop);
    visiblePreviousBottom = placedTop + MOBILE_LABEL_HEIGHT_REM;
  });
  return { offsets, hiddenDays };
}

function Hover({ event, duration, icon, secondaryIcon, detail, bounds, className = "", onHover, children }: { event: RunEvent; duration: number; icon?: string; secondaryIcon?: string; detail?: string; bounds?: { left: number; right: number }; className?: string; onHover: (tip: Tip | null) => void; children?: ReactNode }) {
  return <button onMouseEnter={() => onHover({ event, icon, secondaryIcon, detail })} onMouseLeave={() => onHover(null)} onFocus={() => onHover({ event, icon, secondaryIcon, detail })} onBlur={() => onHover(null)} className={`ff-run-breakdown__point ${className}`} style={pointStyle(event.ticks, duration, bounds)} aria-label={`${event.name}, ${formatTicks(event.ticks)}`}>{children}</button>;
}

function CoinImage() {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 40rem)");
    const update = () => setHovered(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <McmetaImg src={hovered ? COIN_URL : STATIC_COIN_URL} alt="" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} />;
}

function PlayerAvatar({ username, size, pixelSize, wearHat }: { username: string; size: string; pixelSize: 32 | 48; wearHat: boolean }) {
  return <span className="ff-run-breakdown__avatar" style={{ "--avatar-size": size } as CSSProperties}>
    <img className="ff-run-breakdown__avatar-head" src={`https://minotar.net/helm/${encodeURIComponent(username)}/${pixelSize}`} alt="" />
    {wearHat && <img className="ff-run-breakdown__avatar-hat" src={FRIGHTMAS_HAT_URL} alt="" />}
  </span>;
}

const formatAsset = (run: Run, file: string) => gameAsset("fossil-frights", `run_breakdown/${run.assetFolder}/${file}`);
const coinIcon = (id: string | undefined, run: Run) => run.coinIcons?.[id ?? ""] ? gameAsset("fossil-frights", run.coinIcons[id ?? ""]) : COIN_URL;
const hallucinationIcon = (id: string, run: Run) => { const icon = run.hallucinations?.[id]?.icon; return icon ? formatAsset(run, `hallucinations/${icon}.png`) : undefined; };
const deliveryIcon = (event: RunEvent, run: Run) => event.deliveryType ? formatAsset(run, run.deliveryIcons?.[event.deliveryType] ?? `${event.deliveryType}.png`) : undefined;
const taskAsset = (event: RunEvent, run: Run) => gameAsset("fossil-frights", `icons/${taskIcon(event.id, run.format)}`);

export default function FfRunBreakdown({ title = "Run Breakdown" }: { title?: string }) {
  const initialToken = useMemo(readRunToken, []);
  const [token, setToken] = useState(initialToken);
  const [history, setHistory] = useState(savedRuns);
  const [tip, setTip] = useState<Tip | null>(null);
  const [verticalView, setVerticalView] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, width: 0 });
  const historyRef = useRef<HTMLDetailsElement>(null);
  const orderedHistory = useMemo(() => [...history].sort((a, b) => b.cachedAt - a.cachedAt), [history]);
  const hasFrightmasHistory = useMemo(() => history.some((entry) => parseRun(entry.token).theme === "frightmas"), [history]);
  const activeToken = useMemo(() => [token, ...orderedHistory.map((entry) => entry.token)].filter((value): value is string => Boolean(value)).find((value) => parseRun(value).events.length > 0) ?? null, [orderedHistory, token]);
  const run = useMemo<Run | null>(() => activeToken ? parseRun(activeToken) : null, [activeToken]);

  useEffect(() => {
    if (!token) return;
    const next = history.some((entry) => entry.token === token) ? history : [...history, { token, cachedAt: Date.now() }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setHistory(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const close = (event: globalThis.PointerEvent) => { if (historyRef.current && !historyRef.current.contains(event.target as Node)) historyRef.current.open = false; };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    if (!run || !initialToken || activeToken !== initialToken) return;
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(".game__section--ff-run-breakdown")?.scrollIntoView({
        behavior: "smooth", block: "start",
      }),
    );
  }, [activeToken, initialToken, run]);

  useEffect(() => {
    if (!activeToken || activeToken === token) return;
    window.history.replaceState(
      null,
      "",
      `/fossil-frights/run=${encodeURIComponent(activeToken)}${window.location.search}${window.location.hash}`,
    );
    setToken(activeToken);
  }, [activeToken, token]);

  if (!run) return <p className="ff-run-breakdown__empty">No runs yet. Play the game and click the Run Breakdown button to populate this section.</p>;
  const duration = Math.max(run.result?.ticks ?? 0, ...run.events.map((event) => event.ticks), 1);
  const isFrightmas = run.theme === "frightmas";
  const hazardDefinitions = run.hazards ?? {};
  const hallucinationDefinitions = run.hallucinations ?? {};
  const days = run.events.filter((event) => event.kind === "day");
  const tasks = run.events.filter((event) => event.kind === "task");
  const deliveries = run.events.filter((event) => event.kind === "delivery");
  const coins = run.events.filter((event) => event.kind === "coin");
  const dayTone = (ticks: number) => { const day = [...days].reverse().find((event) => event.ticks <= ticks)?.day ?? 1; return day <= 2 ? "green" : day <= 6 ? "yellow" : day <= 9 ? "orange" : "red"; };
  const markers = [...days, ...tasks, ...deliveries, ...(run.result ? [run.result] : [])];
  const lineBounds = (event: RunEvent) => {
    const at = event.ticks / duration * 100;
    const others = markers.filter((item) => item !== event).map((item) => item.ticks / duration * 100);
    const previous = Math.max(...others.filter((position) => position < at), 0);
    const next = Math.min(...others.filter((position) => position > at), 100);
    return { left: (at - previous) / 2, right: (next - at) / 2 };
  };
  const labels = [...days, ...(run.result ? [run.result] : [])].sort((a, b) => b.ticks - a.ticks).reduce<RunEvent[]>((kept, event) => kept.some((item) => Math.abs(item.ticks - event.ticks) < duration * .065) ? kept : [...kept, event], []).sort((a, b) => a.ticks - b.ticks);
  const hazards = Object.keys(hazardDefinitions).flatMap((id) => {
    const changes = run.events.filter((event) => event.kind === "hazard" && event.id === id).sort((a, b) => a.ticks - b.ticks);
    const segments: { id: string; start: RunEvent; end: RunEvent }[] = [];
    changes.forEach((change) => {
      if (!change.state || segments.some((segment) => segment.start.ticks === change.ticks)) return;
      const end = changes.find((candidate) => !candidate.state && candidate.ticks > change.ticks);
      segments.push({ id, start: change, end: end ?? run.result ?? { ...change, ticks: duration } });
    });
    return segments;
  });
  const hallucinations = Object.keys(hallucinationDefinitions).flatMap((id) => {
    const starts = run.events.filter((event) => event.kind === "hallucination" && event.id === id).sort((a, b) => a.ticks - b.ticks);
    return starts.map((start) => {
      const clear = run.events.find((event) => event.kind === "hallucination_clear" && event.ticks > start.ticks);
      return { id, start, end: clear ?? run.result ?? { ...start, ticks: duration } };
    });
  });
  const belowDeliveries = (event: RunEvent) => isFrightmas && event.kind === "task" && event.id === "74";
  const mobileEvents = [...days.filter((event) => event.day !== 1), ...tasks, ...deliveries, ...(run.result ? [run.result] : [])].sort((a, b) => a.ticks - b.ticks || Number(belowDeliveries(a)) - Number(belowDeliveries(b)));
  const mobileLabelLayout = mobileLabelOffsets(mobileEvents.filter((event) => event.kind !== "result"), duration);
  const mobileEventTip = (event: RunEvent): Tip => event.kind === "delivery"
    ? { event, secondaryIcon: formatAsset(run, recipientStocking(event.recipientId, run.recipients) ?? "stockings/fossil.png"), detail: formatTicks(event.ticks) }
    : { event, icon: event.kind === "task" ? taskAsset(event, run) : event.kind === "coin" ? coinIcon(event.id, run) : undefined };
  const chooseRun = (next: string) => { window.history.pushState(null, "", `/fossil-frights/run=${encodeURIComponent(next)}${window.location.search}${window.location.hash}`); setToken(next); if (historyRef.current) historyRef.current.open = false; };
  const removeRun = (event: MouseEvent, value: string) => { event.preventDefault(); event.stopPropagation(); const next = history.filter((item) => item.token !== value); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setHistory(next); };
  const sectionTitle = isFrightmas && run.editionLabel ? `RUN BREAKDOWN: ${run.editionLabel.toUpperCase()}` : title;
  return (
    <>
    <h2 className="section__title">{sectionTitle}</h2>
    <div className={`ff-run-breakdown${verticalView ? " ff-run-breakdown--vertical" : ""}`}>
      <div className="ff-run-breakdown__heading">
        <div className="ff-run-breakdown__identity"><PlayerAvatar username={run.username} size="1.6rem" pixelSize={48} wearHat={isFrightmas} /><span>{run.username}</span></div>
        {history.length > 0 && <details ref={historyRef} className="ff-run-breakdown__history"><summary>Previous Runs<img src={arrowUrl} alt="" /></summary><div className={hasFrightmasHistory ? "is-hatted" : ""}>{orderedHistory.map((entry) => { const item = parseRun(entry.token); return <button key={entry.token} onClick={() => chooseRun(entry.token)}><PlayerAvatar username={item.username} size="1.5rem" pixelSize={32} wearHat={item.theme === "frightmas"} /><span>{item.result?.name ?? "In progress"} · {formatTicks(item.result?.ticks ?? 0)}</span><b onClick={(event) => removeRun(event, entry.token)}>×</b></button>; })}</div></details>}
      </div>
      <div className="ff-run-breakdown__scroll"><div className="ff-run-breakdown__chart" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width }); }} onMouseLeave={() => setTip(null)}>
        {days.map((day, index) => { const end = days[index + 1]?.ticks ?? duration; const color = day.day! <= 2 ? "green" : day.day! <= 6 ? "yellow" : day.day! <= 9 ? "orange" : "red"; return <div key={day.ticks} className={`ff-run-breakdown__day ff-run-breakdown__day--${color}`} style={{ left: `${day.ticks / duration * 100}%`, width: `${(end - day.ticks) / duration * 100}%` }} />; })}
        <div className="ff-run-breakdown__coins">{coins.map((event, index) => <Hover key={index} event={event} duration={duration} icon={coinIcon(event.id, run)} className="ff-run-breakdown__coin" onHover={setTip}><CoinImage /></Hover>)}</div>
        <div className={`ff-run-breakdown__lanes${isFrightmas ? " is-frightmas" : ""}`}>{Object.keys(isFrightmas ? hallucinationDefinitions : hazardDefinitions).map((id) => <div className="ff-run-breakdown__lane" key={id} />)}</div>
        {(isFrightmas ? hallucinations : hazards).map(({ id, start, end }) => {
          const definition = isFrightmas ? hallucinationDefinitions[id] : undefined;
          const name = definition?.name ?? hazardDefinitions[id];
          const color = definition?.color;
          const icon = definition ? hallucinationIcon(id, run) : gameAsset("fossil-frights", `icons/${run.hazardIcons?.[id] ?? `${name.toLowerCase()}.png`}`);
          return <button onMouseEnter={() => setTip({ event: { ...start, name }, icon, detail: `${formatTicks(start.ticks)} – ${formatTicks(end.ticks)}` })} onMouseLeave={() => setTip(null)} key={`${id}-${start.ticks}`} className={`ff-run-breakdown__bar-fill ${isFrightmas ? "ff-run-breakdown__bar-fill--hallucination" : `ff-run-breakdown__bar-fill--${id}`}`} style={{ left: `${start.ticks / duration * 100}%`, width: `${(end.ticks - start.ticks) / duration * 100}%`, ...(isFrightmas ? { "--hallucination-color": color, "--row": Number(id) - 1 } as CSSProperties : {}) }} aria-label={`${name}, ${formatTicks(start.ticks)} to ${formatTicks(end.ticks)}`}>
          {!isFrightmas && run.hazardTextures?.[id] && <McmetaImg className="ff-run-breakdown__bar-texture" src={gameAsset("fossil-frights", `run_breakdown/${run.hazardTextures[id].file}`)} tile="x" rotate={run.hazardTextures[id].rotation} alt="" />}
        </button>;
        })}
        {days.map((event) => <Hover key={event.ticks} event={event} duration={duration} bounds={lineBounds(event)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--day is-${dayTone(event.ticks)}`} />)}
        {tasks.map((event, index) => <Hover key={index} event={event} duration={duration} bounds={lineBounds(event)} icon={taskAsset(event, run)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--task is-${dayTone(event.ticks)}`} />)}
        {deliveries.map((event, index) => { const icon = deliveryIcon(event, run); return <Hover key={`delivery-${index}`} event={event} duration={duration} bounds={lineBounds(event)} secondaryIcon={formatAsset(run, recipientStocking(event.recipientId, run.recipients) ?? "stockings/fossil.png")} detail={formatTicks(event.ticks)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--delivery is-${event.deliveryType}`}>{icon && <McmetaImg className="ff-run-breakdown__delivery-marker" src={icon} alt="" />}</Hover>; })}
        {run.result && <Hover event={run.result} duration={duration} bounds={lineBounds(run.result)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--result${run.result.name === "Victory" ? " is-victory" : ""}`} />}
        {tip && <div className={`ff-run-breakdown__tooltip ff-run-breakdown__tooltip--floating${cursor.y < 62 ? " is-below" : ""}${cursor.x < 120 ? " is-left" : cursor.x > cursor.width - 120 ? " is-right" : ""}`} style={{ left: cursor.x, top: cursor.y }}>{tip.event.kind === "delivery" ? <><McmetaImg src={tip.secondaryIcon!} alt="" />{tip.event.name}</> : <>{tip.icon && <McmetaImg src={tip.icon} alt="" />}{tip.secondaryIcon && <McmetaImg src={tip.secondaryIcon} alt="" />}{tip.event.name}</>}<small>{tip.detail ?? formatTicks(tip.event.ticks)}</small></div>}
      </div><div className="ff-run-breakdown__times">{labels.map((event) => <span key={`${event.name}-${event.ticks}`} className={`${event.ticks > duration * .8 ? "is-right" : "is-left"}${event.kind === "result" && event.name === "Victory" ? " is-victory" : ""}`} style={pointStyle(event.ticks, duration)}>{event.kind === "result" && event.name === "Victory" && <img src={trophyUrl} alt="" />}{formatTicks(event.ticks)}</span>)}</div></div>
      <div className="ff-run-breakdown__mobile-chart" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width }); }} onMouseLeave={() => setTip(null)} style={{ "--mobile-duration": `${duration}` } as CSSProperties}>
        {days.map((day, index) => { const end = days[index + 1]?.ticks ?? duration; const color = day.day! <= 2 ? "green" : day.day! <= 6 ? "yellow" : day.day! <= 9 ? "orange" : "red"; return <div key={day.ticks} className={`ff-run-breakdown__mobile-day ff-run-breakdown__day--${color}`} style={{ top: `${day.ticks / duration * 100}%`, height: `${(end - day.ticks) / duration * 100}%` }} />; })}
        <div className="ff-run-breakdown__mobile-hazards">{(isFrightmas ? hallucinations : hazards).map(({ id, start, end }) => {
          const definition = isFrightmas ? hallucinationDefinitions[id] : undefined;
          const name = definition?.name ?? hazardDefinitions[id];
          const color = definition?.color;
          const icon = definition ? hallucinationIcon(id, run) : gameAsset("fossil-frights", `icons/${run.hazardIcons?.[id] ?? `${name.toLowerCase()}.png`}`);
          return <div key={`${id}-${start.ticks}`} onMouseEnter={() => setTip({ event: { ...start, name }, icon, detail: `${formatTicks(start.ticks)} – ${formatTicks(end.ticks)}` })} onMouseLeave={() => setTip(null)} className={`ff-run-breakdown__mobile-hazard ${isFrightmas ? "ff-run-breakdown__bar-fill--hallucination" : `ff-run-breakdown__bar-fill--${id}`}`} style={{ top: `${start.ticks / duration * 100}%`, height: `${(end.ticks - start.ticks) / duration * 100}%`, ...(isFrightmas ? { "--hallucination-color": color, "--row": Number(id) - 1, "--hallucination-offset": `${(Number(id) - 1) * 10.5}%`, "--hallucination-mobile-offset": `${(Number(id) - 1) * 8.5}%` } as CSSProperties : { left: `${58 + Number(id) * 5}%` }) }}>
          {!isFrightmas && run.hazardTextures?.[id] && <McmetaImg className="ff-run-breakdown__bar-texture" src={gameAsset("fossil-frights", `run_breakdown/${run.hazardTextures[id].file}`)} tile="y" alt="" />}
        </div>;
        })}</div>
        <div className="ff-run-breakdown__mobile-coins">{coins.map((event, index) => <div key={index} onMouseEnter={() => setTip(mobileEventTip(event))} onMouseLeave={() => setTip(null)} className="ff-run-breakdown__mobile-coin" style={{ top: `${event.ticks / duration * 100}%` }} aria-hidden="true"><McmetaImg src={coinIcon(event.id, run)} alt="" /></div>)}</div>
        {mobileEvents.map((event, index) => <div key={`${event.kind}-${event.ticks}-${index}`} onMouseEnter={() => setTip(mobileEventTip(event))} onMouseLeave={() => setTip(null)} className={`ff-run-breakdown__mobile-event ff-run-breakdown__mobile-event--${event.kind}${event.kind === "day" || event.kind === "task" ? ` is-${dayTone(event.ticks)}` : ""}${event.kind === "result" && event.name === "Victory" ? " is-victory" : event.kind === "delivery" ? ` is-${event.deliveryType}` : ""}`} style={event.kind === "result" ? { bottom: 0 } : { top: `${Math.min(99.5, event.ticks / duration * 100)}%` }} />)}
        <div className="ff-run-breakdown__mobile-labels">
          {mobileEvents.map((event, index) => event.kind !== "result" && !mobileLabelLayout.hiddenDays.has(event) && <div key={`${event.kind}-${event.ticks}-${index}`} className={`ff-run-breakdown__mobile-label${event.kind === "day" ? ` ff-run-breakdown__mobile-label--day is-${dayTone(event.ticks)}` : ""}`} style={{ top: `${Math.min(99.5, event.ticks / duration * 100)}%`, "--label-shift": `${mobileLabelLayout.offsets.get(event) ?? 0}rem` } as CSSProperties}><span>{(event.kind === "task" || event.kind === "delivery") && <img src={event.kind === "task" ? taskAsset(event, run) : deliveryIcon(event, run)} alt="" />}{event.name} <small>{formatTicks(event.ticks)}</small></span></div>)}
        </div>
        {tip && <div className="ff-run-breakdown__mobile-tooltip" style={{ left: cursor.x, top: cursor.y }}>{tip.event.kind === "delivery" ? <><McmetaImg src={tip.secondaryIcon!} alt="" />{tip.event.name}</> : <>{tip.icon && <McmetaImg src={tip.icon} alt="" />}{tip.secondaryIcon && <McmetaImg src={tip.secondaryIcon} alt="" />}{tip.event.name}</>}<small>{tip.detail ?? formatTicks(tip.event.ticks)}</small></div>}
      </div>{run.result && <div className={`ff-run-breakdown__mobile-result${run.result.name === "Victory" ? " is-victory" : ""}`}>{run.result.name === "Victory" ? <strong><img src={trophyUrl} alt="" />{formatTicks(run.result.ticks)}</strong> : <>{run.result.name} at {formatTicks(run.result.ticks)}</>}</div>}
      <label className="ff-run-breakdown__view-toggle"><input type="checkbox" checked={verticalView} onChange={(event) => setVerticalView(event.target.checked)} /> <span>View Vertically</span></label>
    </div>
    </>
  );
}
