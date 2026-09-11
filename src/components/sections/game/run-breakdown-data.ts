export type EventKind = "day" | "task" | "hazard" | "coin" | "result";
export type RunEvent = { kind: EventKind; name: string; ticks: number; id?: string; state?: boolean; day?: number };
export type Run = { token: string; username: string; events: RunEvent[]; result?: RunEvent };

export const HAZARDS: Record<string, string> = { "1": "Lights", "2": "Lava", "3": "Floods", "4": "Security", "5": "Curse" };
export const COIN_USES: Record<string, string> = { "01": "Well", "02": "Sculkadillo crane", "03": "Sarcophagus", "04": "Crab", "11": "Veloci-Tea", "12": "Pteranadon Twist", "13": "Raptor Rush", "14": "Bubbly Bat", "15": "Chorus Cola", "16": "Fossil Fizz" };
export const TASKS: Record<string, string> = {
  "01":"bathroom_leak","02":"check_ankylo","03":"check_security","04":"climb_the_tower","05":"count_shells","06":"count_toes","07":"dig_sand","08":"dive_into_well","09":"fire_pottery","10":"fix_cracked_egg","11":"fix_mars","12":"lock_register","13":"make_some_noise","14":"polish_bell","15":"reset_fountain","16":"reset_salt_level","17":"static_buildup","18":"swat_flies","19":"sweep_popcorn","20":"tnt_test","21":"toilet_clog","22":"visit_archean","23":"visit_jurassic","24":"visit_neogene","25":"visit_silurian","26":"water_temp","27":"ancient_portal","28":"bring_brush","29":"brush_delivery","30":"chlorinify","31":"coffee_top_up","32":"cool_it","33":"credit_reel","34":"feed_parrot","35":"feed_the_fish","36":"feed_the_plants","37":"fix_sculker","38":"heat_it_up","39":"nautilus_guard","40":"picnic_with_trike","41":"popcorn_buckets","42":"refill_coffee","43":"refill_ice","44":"replenish_soap","45":"restock_plushies","46":"revitalize_coral","47":"shark_bait","48":"smelly_toilet","49":"sponge_up_spill","50":"wash_muddy_sherd","51":"water_crops","52":"a_c_reset","53":"basketball_dance","54":"defrost_freezer","55":"evolution","56":"feed_the_bats","57":"fertilize_plant","58":"glowberry_trees","59":"holy_grail","60":"hoveraptor","61":"pig_wrangler","62":"return_the_key","63":"skincare_routine","64":"star_gazing","65":"the_lost_code","66":"Lab Experiment",
};

export function readRunToken(): string | null {
  const segment = window.location.pathname.split("/").filter(Boolean)[1];
  return segment?.startsWith("run=") ? decodeURIComponent(segment.slice(4)) : null;
}

export function parseRun(token: string): Run {
  const username = token.match(/^1U(.*?)(?=_(?:D\d|T\d{2}|H[1-5][01]|C\d{2}|R[FLV]\d)|$)/)?.[1] ?? "Unknown";
  const events = token.split("_").flatMap((part): RunEvent[] => {
    let m = part.match(/^D(\d+)\.(\d+)$/);
    if (m) return [{ kind: "day", name: `Day ${m[1]}`, day: Number(m[1]), ticks: Number(m[2]) }];
    m = part.match(/^T(\d{2})\.(\d+)$/);
    if (m) return [{ kind: "task", id: m[1], name: (TASKS[m[1]] ?? `Task ${m[1]}`).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), ticks: Number(m[2]) }];
    m = part.match(/^H([1-5])([01])\.(\d+)$/);
    if (m) return [{ kind: "hazard", id: m[1], state: m[2] === "1", name: `${HAZARDS[m[1]]} ${m[2] === "1" ? "on" : "off"}`, ticks: Number(m[3]) }];
    m = part.match(/^C(\d{2})\.(\d+)$/);
    if (m) return [{ kind: "coin", id: m[1], name: COIN_USES[m[1]] ?? `Coin use ${m[1]}`, ticks: Number(m[2]) }];
    m = part.match(/^R([FLV])(\d+)\.(\d+)$/);
    if (m) return [{ kind: "result", day: Number(m[2]), name: ({ F: "Defeat", L: "Leave", V: "Victory" })[m[1]] ?? "Result", ticks: Number(m[3]) }];
    return [];
  });
  return { token, username, events, result: [...events].reverse().find((event) => event.kind === "result") };
}

export function formatTicks(ticks: number): string {
  const minutes = Math.floor(ticks / 1200);
  const seconds = Math.floor((ticks % 1200) / 20);
  const hundredths = Math.floor((ticks % 20) * 5);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

export function taskIcon(id?: string): string {
  const number = Number(id);
  return number <= 26 ? "task_easy.png" : number <= 51 ? "task_medium.png" : number === 66 ? "task_final.png" : "task_hard.png";
}

export function taskDifficulty(id?: string): string {
  const number = Number(id);
  return number <= 26 ? "Easy" : number <= 51 ? "Medium" : number === 66 ? "Final" : "Hard";
}
