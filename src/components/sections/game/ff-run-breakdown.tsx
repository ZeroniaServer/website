import { type CSSProperties, type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { gameAsset } from "../../../lib/games";
import arrowUrl from "../../../assets/sprites/arrow_down.png";
import { formatTicks, HAZARDS, parseRun, readRunToken, taskIcon, type Run, type RunEvent } from "./run-breakdown-data";
import "./ff-run-breakdown.css";

const STORAGE_KEY = "ff-run-breakdowns";
type HistoryEntry = { token: string; cachedAt: number };
const savedRuns = (): HistoryEntry[] => { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(value) ? value.map((entry, index) => typeof entry === "string" ? { token: entry, cachedAt: index } : entry).filter((entry) => entry?.token) : []; } catch { return []; } };
const pointStyle = (ticks: number, duration: number, hit?: number) => ({ "--at": `${(ticks / duration) * 100}%`, ...(hit ? { "--hit": `${hit}%` } : {}) } as CSSProperties);
type Tip = { event: RunEvent; icon?: string; detail?: string };
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

function Hover({ event, duration, icon, detail, hit, className = "", onHover }: { event: RunEvent; duration: number; icon?: string; detail?: string; hit?: number; className?: string; onHover: (tip: Tip | null) => void }) {
  return <button onMouseEnter={() => onHover({ event, icon, detail })} onMouseLeave={() => onHover(null)} onFocus={() => onHover({ event, icon, detail })} onBlur={() => onHover(null)} className={`ff-run-breakdown__point ${className}`} style={pointStyle(event.ticks, duration, hit)} aria-label={`${event.name}, ${formatTicks(event.ticks)}`} />;
}

export default function FfRunBreakdown() {
  const initialToken = useMemo(readRunToken, []);
  const [token, setToken] = useState(initialToken);
  const [history, setHistory] = useState(savedRuns);
  const [tip, setTip] = useState<Tip | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const historyRef = useRef<HTMLDetailsElement>(null);
  const run = useMemo<Run | null>(() => token ? parseRun(token) : null, [token]);

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
    if (!run) return;
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(".game__section--ff-run-breakdown")?.scrollIntoView({
        behavior: "smooth", block: "start",
      }),
    );
  }, [run]);

  if (!run) return <p className="ff-run-breakdown__empty">No runs yet. Play the game and click the Run Breakdown button to populate this section.</p>;
  const duration = Math.max(run.result?.ticks ?? 0, ...run.events.map((event) => event.ticks), 1);
  const days = run.events.filter((event) => event.kind === "day");
  const tasks = run.events.filter((event) => event.kind === "task");
  const coins = run.events.filter((event) => event.kind === "coin");
  const dayTone = (ticks: number) => { const day = [...days].reverse().find((event) => event.ticks <= ticks)?.day ?? 1; return day <= 2 ? "green" : day <= 6 ? "yellow" : day <= 9 ? "orange" : "red"; };
  const markers = [...days, ...tasks, ...(run.result ? [run.result] : [])];
  const hitSize = (event: RunEvent) => Math.max(.08, Math.min(5, Math.min(...markers.filter((item) => item !== event).map((item) => Math.abs(item.ticks - event.ticks) / duration * 100), 10) / 2));
  const labels = [...days, ...(run.result ? [run.result] : [])].sort((a, b) => b.ticks - a.ticks).reduce<RunEvent[]>((kept, event) => kept.some((item) => Math.abs(item.ticks - event.ticks) < duration * .065) ? kept : [...kept, event], []).sort((a, b) => a.ticks - b.ticks);
  const hazards = Object.keys(HAZARDS).map((id) => {
    const changes = run.events.filter((event) => event.kind === "hazard" && event.id === id);
    const start = changes.find((event) => event.state);
    const end = changes.find((event) => !event.state && event.ticks > (start?.ticks ?? -1));
    return start ? { id, start, end: end ?? run.result ?? { ...start, ticks: duration } } : null;
  }).filter(Boolean) as { id: string; start: RunEvent; end: RunEvent }[];
  const mobileEvents = [...days.filter((event) => event.day !== 1), ...tasks, ...(run.result ? [run.result] : [])].sort((a, b) => a.ticks - b.ticks);
  const mobileLabelLayout = mobileLabelOffsets(mobileEvents.filter((event) => event.kind !== "result"), duration);
  const chooseRun = (next: string) => { window.history.pushState(null, "", `/fossil-frights/run=${encodeURIComponent(next)}`); setToken(next); if (historyRef.current) historyRef.current.open = false; };
  const removeRun = (event: MouseEvent, value: string) => { event.preventDefault(); event.stopPropagation(); const next = history.filter((item) => item.token !== value); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setHistory(next); };
  const orderedHistory = [...history].sort((a, b) => a.cachedAt - b.cachedAt);
  return (
    <div className="ff-run-breakdown" style={{ "--coin-texture": `url(${gameAsset("fossil-frights", "icons/dino_coin.png")})` } as CSSProperties}>
      <div className="ff-run-breakdown__heading">
        <div className="ff-run-breakdown__identity"><img src={`https://mc-heads.net/avatar/${encodeURIComponent(run.username)}/48`} alt="" /><span>{run.username}</span></div>
        {history.length > 0 && <details ref={historyRef} className="ff-run-breakdown__history"><summary>Previous Runs<img src={arrowUrl} alt="" /></summary><div>{orderedHistory.map((entry) => { const item = parseRun(entry.token); return <button key={entry.token} onClick={() => chooseRun(entry.token)}>{item.result?.name ?? "In progress"} · {formatTicks(item.result?.ticks ?? 0)}<b onClick={(event) => removeRun(event, entry.token)}>×</b></button>; })}</div></details>}
      </div>
      <div className="ff-run-breakdown__scroll"><div className="ff-run-breakdown__chart" onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top }); }} onMouseLeave={() => setTip(null)}>
        {days.map((day, index) => { const end = days[index + 1]?.ticks ?? duration; const color = day.day! <= 2 ? "green" : day.day! <= 6 ? "yellow" : day.day! <= 9 ? "orange" : "red"; return <div key={day.ticks} className={`ff-run-breakdown__day ff-run-breakdown__day--${color}`} style={{ left: `${day.ticks / duration * 100}%`, width: `${(end - day.ticks) / duration * 100}%` }} />; })}
        <div className="ff-run-breakdown__coins">{coins.map((event, index) => <Hover key={index} event={event} duration={duration} className="ff-run-breakdown__coin" onHover={setTip} />)}</div>
        <div className="ff-run-breakdown__lanes">{Object.keys(HAZARDS).map((id) => <div className="ff-run-breakdown__lane" key={id} />)}</div>
        {hazards.map(({ id, start, end }) => <button onMouseEnter={() => setTip({ event: { ...start, name: HAZARDS[id] }, icon: gameAsset("fossil-frights", `icons/${HAZARDS[id].toLowerCase()}.png`), detail: `${formatTicks(start.ticks)} – ${formatTicks(end.ticks)}` })} onMouseLeave={() => setTip(null)} key={id} className={`ff-run-breakdown__bar-fill ff-run-breakdown__bar-fill--${id}`} style={{ left: `${start.ticks / duration * 100}%`, width: `${(end.ticks - start.ticks) / duration * 100}%` }} aria-label={`${HAZARDS[id]}, ${formatTicks(start.ticks)} to ${formatTicks(end.ticks)}`} />)}
        {days.map((event) => <Hover key={event.ticks} event={event} duration={duration} hit={hitSize(event)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--day is-${dayTone(event.ticks)}`} />)}
        {tasks.map((event, index) => <Hover key={index} event={event} duration={duration} hit={hitSize(event)} icon={gameAsset("fossil-frights", `icons/${taskIcon(event.id)}`)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--task is-${dayTone(event.ticks)}`} />)}
        {run.result && <Hover event={run.result} duration={duration} hit={hitSize(run.result)} onHover={setTip} className={`ff-run-breakdown__line ff-run-breakdown__line--result${run.result.name === "Victory" ? " is-victory" : ""}`} />}
        {tip && <div className={`ff-run-breakdown__tooltip ff-run-breakdown__tooltip--floating${cursor.y < 62 ? " is-below" : ""}`} style={{ left: cursor.x, top: cursor.y }}>{tip.icon && <img src={tip.icon} alt="" />}{tip.event.name}<small>{tip.detail ?? formatTicks(tip.event.ticks)}</small></div>}
      </div><div className="ff-run-breakdown__times">{labels.map((event) => <span key={`${event.name}-${event.ticks}`} className={`${event.ticks > duration * .8 ? "is-right" : "is-left"}${event.kind === "result" && event.name === "Victory" ? " is-victory" : ""}`} style={pointStyle(event.ticks, duration)}>{formatTicks(event.ticks)}</span>)}</div></div>
      <div className="ff-run-breakdown__mobile-chart" style={{ "--mobile-duration": `${duration}` } as CSSProperties}>
        {days.map((day, index) => { const end = days[index + 1]?.ticks ?? duration; const color = day.day! <= 2 ? "green" : day.day! <= 6 ? "yellow" : day.day! <= 9 ? "orange" : "red"; return <div key={day.ticks} className={`ff-run-breakdown__mobile-day ff-run-breakdown__day--${color}`} style={{ top: `${day.ticks / duration * 100}%`, height: `${(end - day.ticks) / duration * 100}%` }} />; })}
        <div className="ff-run-breakdown__mobile-hazards">{hazards.map(({ id, start, end }) => <div key={id} className={`ff-run-breakdown__mobile-hazard ff-run-breakdown__bar-fill--${id}`} style={{ top: `${start.ticks / duration * 100}%`, height: `${(end.ticks - start.ticks) / duration * 100}%`, left: `${58 + Number(id) * 5}%` }} />)}</div>
        <div className="ff-run-breakdown__mobile-coins">{coins.map((event, index) => <div key={index} className="ff-run-breakdown__mobile-coin" style={{ top: `${event.ticks / duration * 100}%` }} aria-hidden="true" />)}</div>
        {mobileEvents.map((event, index) => <div key={`${event.kind}-${event.ticks}-${index}`} className={`ff-run-breakdown__mobile-event ff-run-breakdown__mobile-event--${event.kind}${event.kind === "day" || event.kind === "task" ? ` is-${dayTone(event.ticks)}` : ""}${event.kind === "result" && event.name === "Victory" ? " is-victory" : ""}`} style={event.kind === "result" ? { bottom: 0 } : { top: `${Math.min(99.5, event.ticks / duration * 100)}%` }} />)}
        <div className="ff-run-breakdown__mobile-labels">
          {mobileEvents.map((event, index) => event.kind !== "result" && !mobileLabelLayout.hiddenDays.has(event) && <div key={`${event.kind}-${event.ticks}-${index}`} className={`ff-run-breakdown__mobile-label${event.kind === "day" ? ` ff-run-breakdown__mobile-label--day is-${dayTone(event.ticks)}` : ""}`} style={{ top: `${Math.min(99.5, event.ticks / duration * 100)}%`, "--label-shift": `${mobileLabelLayout.offsets.get(event) ?? 0}rem` } as CSSProperties}><span>{event.kind === "task" && <img src={gameAsset("fossil-frights", `icons/${taskIcon(event.id)}`)} alt="" />}{event.name} <small>{formatTicks(event.ticks)}</small></span></div>)}
        </div>
      </div>{run.result && <div className={`ff-run-breakdown__mobile-result${run.result.name === "Victory" ? " is-victory" : ""}`}>{run.result.name === "Victory" ? <strong>{formatTicks(run.result.ticks)}</strong> : <>{run.result.name} at {formatTicks(run.result.ticks)}</>}</div>}
    </div>
  );
}
