export type EventKind = "day" | "task" | "hazard" | "hallucination" | "hallucination_clear" | "delivery" | "coin" | "result";
export type RunEvent = { kind: EventKind; name: string; ticks: number; id?: string; state?: boolean; day?: number; recipientId?: string; deliveryType?: "present" | "coal" };

type TaskBands = { easyMax: number; mediumMax: number; finalId: number };
type RunFormatMapping = {
  tasks: Record<string, string>;
  coinUses: Record<string, string>;
  hazards?: Record<string, string>;
  hazardTextures?: Record<string, { file: string; rotation: 90 | 180 | 270 }>;
  hallucinations?: Record<string, { name: string; color: string; icon: string }>;
  recipients?: Record<string, { name: string; stocking: string }>;
  taskBands: TaskBands;
  eventCodes?: { hazard?: string; hallucination?: string; hallucinationOffId?: string; deliveries?: Record<string, string> };
  coinIcons?: Record<string, string>;
  hazardIcons?: Record<string, string>;
  deliveryIcons?: Record<string, string>;
  editionLabel?: string;
  theme?: string;
  assetFolder?: string;
};

const mappingFiles = import.meta.glob("./run-breakdown-maps/*.json", { eager: true, import: "default" }) as Record<string, RunFormatMapping>;
const FORMAT_MAPPINGS = Object.fromEntries(
  Object.entries(mappingFiles).map(([path, mapping]) => [path.split("/").pop()!.replace(/\.json$/, ""), mapping]),
);
const FORMAT_PREFIXES = Object.keys(FORMAT_MAPPINGS).sort((a, b) => b.length - a.length);

export type Run = {
  token: string;
  username: string;
  events: RunEvent[];
  result?: RunEvent;
  format: string;
  editionLabel?: string;
  theme?: string;
  assetFolder?: string;
  hazards?: RunFormatMapping["hazards"];
  hazardTextures?: RunFormatMapping["hazardTextures"];
  hallucinations?: RunFormatMapping["hallucinations"];
  recipients?: RunFormatMapping["recipients"];
  coinIcons?: RunFormatMapping["coinIcons"];
  hazardIcons?: RunFormatMapping["hazardIcons"];
  deliveryIcons?: RunFormatMapping["deliveryIcons"];
};

function getMapping(format: string): RunFormatMapping {
  return FORMAT_MAPPINGS[format] ?? FORMAT_MAPPINGS["1U"];
}

function formatForToken(token: string): string {
  return FORMAT_PREFIXES.find((prefix) => token.startsWith(prefix)) ?? "1U";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function usernameForToken(token: string, format: string, mapping: RunFormatMapping): string {
  const eventHeads = ["D\\d+", "T\\d{2}", "C\\d{2}", "R[FLV]\\d+"];
  if (mapping.eventCodes?.hazard) eventHeads.push(`${escapeRegex(mapping.eventCodes.hazard)}\\d+[01]`);
  if (mapping.eventCodes?.hallucination) eventHeads.push(`${escapeRegex(mapping.eventCodes.hallucination)}\\d+`);
  Object.values(mapping.eventCodes?.deliveries ?? {}).forEach((code) => eventHeads.push(`${escapeRegex(code)}\\d+`));
  const expression = new RegExp(`^${escapeRegex(format)}(.*?)(?=_(?:${eventHeads.join("|")})\\.|$)`);
  return token.match(expression)?.[1] || "Unknown";
}

export function recipientName(id: string | undefined, recipients?: Run["recipients"]): string {
  const normalizedId = id ? String(Number(id)) : "";
  return recipients?.[normalizedId]?.name ?? `Recipient ${id ?? "?"}`;
}

export function recipientStocking(id: string | undefined, recipients?: Run["recipients"]): string | undefined {
  const normalizedId = id ? String(Number(id)) : "";
  const stocking = recipients?.[normalizedId]?.stocking;
  return stocking ? `stockings/${stocking}.png` : undefined;
}

export function readRunToken(): string | null {
  const segment = window.location.pathname.split("/").filter(Boolean)[1];
  return segment?.startsWith("run=") ? decodeURIComponent(segment.slice(4)) : null;
}

export function parseRun(token: string): Run {
  const format = formatForToken(token);
  const mapping = getMapping(format);
  const events = token.split("_").flatMap((part): RunEvent[] => {
    let match = part.match(/^D(\d+)\.(\d+)$/);
    if (match) return [{ kind: "day", name: `Day ${match[1]}`, day: Number(match[1]), ticks: Number(match[2]) }];

    match = part.match(/^T(\d{2})\.(\d+)$/);
    if (match) {
      const taskName = mapping.tasks[match[1]] ?? `Task ${match[1]}`;
      const displayName = taskName.includes("_")
        ? taskName.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
        : taskName.charAt(0).toUpperCase() + taskName.slice(1);
      return [{ kind: "task", id: match[1], name: displayName, ticks: Number(match[2]) }];
    }

    const hallucinationCode = mapping.eventCodes?.hallucination;
    if (hallucinationCode && mapping.hallucinations) {
      const pattern = new RegExp(`^${escapeRegex(hallucinationCode)}(\\d+)\\.(\\d+)$`);
      match = part.match(pattern);
      if (match) {
        if (match[1] === mapping.eventCodes?.hallucinationOffId) return [{ kind: "hallucination_clear", name: "Hallucinations cleared", ticks: Number(match[2]) }];
        const hallucination = mapping.hallucinations[match[1]];
        return hallucination ? [{ kind: "hallucination", id: match[1], state: true, name: hallucination.name, ticks: Number(match[2]) }] : [];
      }
    }

    const hazardCode = mapping.eventCodes?.hazard;
    if (hazardCode && mapping.hazards) {
      const pattern = new RegExp(`^${escapeRegex(hazardCode)}(\\d+)([01])\\.(\\d+)$`);
      match = part.match(pattern);
      if (match && mapping.hazards[match[1]]) {
        return [{ kind: "hazard", id: match[1], state: match[2] === "1", name: `${mapping.hazards[match[1]]} ${match[2] === "1" ? "on" : "off"}`, ticks: Number(match[3]) }];
      }
    }

    match = part.match(/^C(\d{2})\.(\d+)$/);
    if (match) return [{ kind: "coin", id: match[1], name: mapping.coinUses[match[1]] ?? `Coin use ${match[1]}`, ticks: Number(match[2]) }];

    for (const [deliveryType, code] of Object.entries(mapping.eventCodes?.deliveries ?? {})) {
      const pattern = new RegExp(`^${escapeRegex(code)}(\\d+)\\.(\\d+)$`);
      match = part.match(pattern);
      if (match && (deliveryType === "present" || deliveryType === "coal")) {
        return [{ kind: "delivery", deliveryType, recipientId: match[1], name: recipientName(match[1], mapping.recipients), ticks: Number(match[2]) }];
      }
    }

    match = part.match(/^R([FLV])(\d+)\.(\d+)$/);
    if (match) return [{ kind: "result", day: Number(match[2]), name: ({ F: "Defeat", L: "Leave", V: "Victory" })[match[1]] ?? "Result", ticks: Number(match[3]) }];
    return [];
  });

  return {
    token,
    username: usernameForToken(token, format, mapping),
    events,
    result: [...events].reverse().find((event) => event.kind === "result"),
    format,
    editionLabel: mapping.editionLabel,
    theme: mapping.theme,
    assetFolder: mapping.assetFolder,
    hazards: mapping.hazards,
    hazardTextures: mapping.hazardTextures,
    hallucinations: mapping.hallucinations,
    recipients: mapping.recipients,
    coinIcons: mapping.coinIcons,
    hazardIcons: mapping.hazardIcons,
    deliveryIcons: mapping.deliveryIcons,
  };
}

export function formatTicks(ticks: number): string {
  const minutes = Math.floor(ticks / 1200);
  const seconds = Math.floor((ticks % 1200) / 20);
  const hundredths = Math.floor((ticks % 20) * 5);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function taskIcon(id?: string, format = "1U"): string {
  const number = Number(id);
  const { easyMax, mediumMax, finalId } = getMapping(format).taskBands;
  if (number === finalId) return "task_final.png";
  if (number <= easyMax) return "task_easy.png";
  if (number <= mediumMax) return "task_medium.png";
  return "task_hard.png";
}

export function taskDifficulty(id?: string, format = "1U"): string {
  const number = Number(id);
  const { easyMax, mediumMax, finalId } = getMapping(format).taskBands;
  if (number === finalId) return "Final";
  if (number <= easyMax) return "Easy";
  if (number <= mediumMax) return "Medium";
  return "Hard";
}
