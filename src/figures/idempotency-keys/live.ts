// Live behavior for the idempotency-key figure. Every motion, digit and
// readout comes from the model in model.ts; this file only schedules it.
import { translateAlong, type Projection } from "../kit/iso-kit";
import layout from "./layout.json";
import { arrive, emptyStore, finish, KEY, KEY_2, SCENARIOS, type Body, type Outcome, type Scenario, type Store } from "./model";

const P = layout.P as Projection;
const { INLET, READER, PRESS, TRAY_AT, RAIL_TO, TRAY_X } = layout.stations;
const H = layout.heights;
const SPIKE_OF: Record<string, number> = { [KEY]: 1, [KEY_2]: 2 };

type Channel = "c1" | "c2" | "pins" | "ram" | "r0" | "r1" | "r2" | "t0" | "t1" | "t2";
interface Move { ch: Channel; t0: number; t1: number; to: number; from?: number }
interface Event { t: number; run: () => void; done?: boolean }
interface Plan { moves: Move[]; events: Event[]; end: number }

const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

export function mount(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>(".iso-stage")!;
  const svg = stage.querySelector("svg")!;
  const part = (name: string) => svg.querySelector<SVGGElement>(`[data-part="${name}"]`)!;
  const readout = root.querySelector<HTMLElement>("[data-readout]")!;
  const digits = part("digits") as unknown as SVGTextElement;
  const lamp = part("lamp");
  const cards = { c1: part("card-1"), c2: part("card-2") };
  const cardLayer = svg.querySelector<SVGGElement>('[data-layer="cards"]')!;
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-scenario]")];
  const resetButton = root.querySelector<HTMLButtonElement>("[data-reset]");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  const signal = abort.signal;

  let store: Store = emptyStore();
  let attempt = 0;

  // Current values of every moving channel.
  const value: Record<Channel, number> = {
    c1: INLET, c2: INLET,
    pins: H.PIN_REST, ram: H.RAM_REST,
    r0: H.RECEIPT_Z, r1: H.RECEIPT_DROP, r2: H.RECEIPT_DROP,
    t0: H.TAB_REST, t1: H.TAB_REST, t2: H.TAB_REST,
  };

  const say = (text: string) => { if (readout.textContent !== text) readout.textContent = text; };
  const show = (el: Element, on: boolean) => ((el as SVGElement).style.opacity = on ? "1" : "0");
  const setOn = (el: Element, on: boolean) => (on ? el.setAttribute("data-on", "") : el.removeAttribute("data-on"));
  const setDigits = (n: number) => (digits.textContent = String(n).padStart(4, "0"));
  const setLamp = (status: "ok" | "bad" | null) => (status ? lamp.setAttribute("data-status", status) : lamp.removeAttribute("data-status"));

  // Cards ride the rails at z = 0 and drop onto the tray floor past the rails.
  const cardDz = (x: number) => {
    const u = Math.min(1, Math.max(0, (x - (RAIL_TO - 4)) / (TRAY_X + 6 - (RAIL_TO - 4))));
    return (H.TRAY_FLOOR - H.RAIL_H) * u;
  };

  function draw() {
    for (const id of ["c1", "c2"] as const) cards[id].setAttribute("transform", translateAlong(P, [value[id], 0, cardDz(value[id])]));
    // Paint the nearer card last: nearer means larger x along the rails.
    const [a, b] = value.c1 <= value.c2 ? [cards.c1, cards.c2] : [cards.c2, cards.c1];
    if (cardLayer.lastElementChild !== b) cardLayer.append(a, b);
    part("pins").setAttribute("transform", translateAlong(P, [0, 0, value.pins - H.PIN_READ]));
    part("ram").setAttribute("transform", translateAlong(P, [0, 0, value.ram - H.RAM_PRESS]));
    for (const i of [0, 1, 2]) {
      part(`receipt-${i}`).setAttribute("transform", translateAlong(P, [0, 0, value[`r${i}` as Channel] - H.RECEIPT_Z]));
      part(`tab-${i}`).setAttribute("transform", translateAlong(P, [0, 0, value[`t${i}` as Channel] - H.TAB_REST]));
    }
  }

  function line(o: Outcome, key: string) {
    switch (o.kind) {
      case "processed": return `${key} · 201 Created · charges ${store.charges}`;
      case "replayed": return `${key} · 201 replayed · charges ${store.charges}`;
      case "mismatch": return `${key} · 422 body differs · charges ${store.charges}`;
      case "in-flight": return `${key} · 409, first still in flight`;
    }
  }

  // Build the timeline for one scenario. Outcomes are decided by running the
  // same model calls, in the same order, on a copy of the store.
  function planFor(s: Scenario): Plan {
    const sim: Store = structuredClone(store);
    const o1 = arrive(sim, s.key, s.body);
    const o2 = s.duplicate ? arrive(sim, s.key, s.body) : null;
    const i = SPIKE_OF[s.key];
    const r = `r${i}` as Channel;
    const tab = `t${i}` as Channel;
    const n = ++attempt;
    const moves: Move[] = [];
    const events: Event[] = [];
    const move = (ch: Channel, t0: number, t1: number, to: number) => moves.push({ ch, t0, t1, to });
    const at = (t: number, run: () => void) => events.push({ t, run });
    let end = 0;

    at(0, () => {
      value.c1 = INLET;
      cards.c1.setAttribute("data-body", s.body);
      show(cards.c1, true);
      show(cards.c2, false);
      setLamp(null);
      say(`#${n} ${s.key} · sending`);
    });
    move("c1", 0, 0.9, READER);
    move("pins", 0.9, 1.15, H.PIN_READ);
    at(1.15, () => { arrive(store, s.key, s.body); say(`#${n} ${s.key} · reading key`); });
    move("pins", 1.5, 1.75, H.PIN_REST);

    if (o1.kind === "processed") {
      move(tab, 1.2, 1.45, H.TAB_UP);
      at(1.2, () => { setOn(part(`tab-${i}`), true); say(`#${n} ${s.key} · new key, locked`); });
      move("c1", 1.6, 2.3, PRESS);
      move("ram", 2.3, 2.65, H.RAM_PRESS);
      at(2.65, () => {
        finish(store, s.key);
        setDigits(store.charges);
        // With a duplicate in play, its 409 stays on the readout until the first completes.
        if (!s.duplicate) say(`#${n} ${s.key} · charged, storing response`);
      });
      move("ram", 2.8, 3.2, H.RAM_REST);
      at(2.8, () => { value[r] = H.RECEIPT_DROP; show(part(`receipt-${i}`), true); });
      move(r, 2.8, 3.3, H.RECEIPT_Z);
      move(tab, 3.4, 3.7, H.TAB_REST);
      at(3.7, () => setOn(part(`tab-${i}`), false));
      move("c1", 3.4, 4.2, TRAY_AT);
      at(4.2, () => { setLamp("ok"); say(line(o1, s.key)); });
      end = 4.6;
    } else if (o1.kind === "replayed") {
      at(1.25, () => { setOn(part(`receipt-${i}`), true); say(`#${n} ${s.key} · stored, same body`); });
      move(r, 1.25, 1.65, H.RECEIPT_Z + 12);
      move("c1", 1.8, 3.0, TRAY_AT);
      move(r, 2.4, 2.8, H.RECEIPT_Z);
      at(2.8, () => setOn(part(`receipt-${i}`), false));
      at(3.0, () => { setLamp("ok"); say(line(o1, s.key)); });
      end = 3.4;
    } else {
      // Rejected at the reader: 422 for a different body, 409 in flight.
      at(1.25, () => { setOn(part(`receipt-${i}`), true); say(`#${n} ${s.key} · stored, body differs`); });
      move(r, 1.25, 1.65, H.RECEIPT_Z + 12);
      move(r, 2.0, 2.4, H.RECEIPT_Z);
      at(2.4, () => { setOn(part(`receipt-${i}`), false); setLamp("bad"); say(line(o1, s.key)); });
      move("c1", 1.9, 2.6, INLET);
      at(2.7, () => show(cards.c1, false));
      end = 3.1;
    }

    if (o2) {
      // The duplicate leaves the inlet once the first card has cleared the reader.
      const t = o1.kind === "processed" ? 1.6 : 1.9;
      at(t, () => { value.c2 = INLET; cards.c2.setAttribute("data-body", s.body); show(cards.c2, true); });
      move("c2", t, t + 0.75, READER);
      move("pins", t + 0.75, t + 0.95, H.PIN_READ);
      at(t + 0.95, () => {
        const o = arrive(store, s.key, s.body);
        if (o.kind !== "replayed") { setLamp("bad"); say(`duplicate · ${line(o, s.key)}`); }
      });
      move("pins", t + 1.0, t + 1.2, H.PIN_REST);
      if (o2.kind === "replayed") {
        move("c2", t + 1.1, t + 2.1, TRAY_AT);
        at(t + 2.0, () => show(cards.c1, false));
        at(t + 2.1, () => { setLamp("ok"); say(line(o2, s.key)); });
        end = Math.max(end, t + 2.5);
      } else {
        move("c2", t + 1.1, t + 1.7, INLET);
        at(t + 1.75, () => show(cards.c2, false));
      }
    }
    return { moves, events: events.sort((a, b) => a.t - b.t), end };
  }

  function resetPlan(): Plan {
    return {
      moves: [{ ch: "r1", t0: 0, t1: 0.6, to: H.RECEIPT_DROP }, { ch: "r2", t0: 0, t1: 0.6, to: H.RECEIPT_DROP }],
      events: [
        { t: 0, run: () => { show(cards.c2, false); setLamp(null); } },
        { t: 0, run: () => { value.c1 = INLET; cards.c1.setAttribute("data-body", "A"); show(cards.c1, true); } },
        { t: 0.3, run: () => { show(part("receipt-1"), false); show(part("receipt-2"), false); } },
        { t: 0.6, run: () => { store = emptyStore(); attempt = 0; setDigits(0); say("store empty · charges 0"); } },
      ],
      end: 1.0,
    };
  }

  // The clock.
  let plan: Plan | null = null;
  let clock = 0;
  let last = 0;
  let frame = 0;
  let visible = false;

  function apply(p: Plan, t: number) {
    for (const e of p.events) if (!e.done && e.t <= t) { e.done = true; e.run(); }
    for (const m of p.moves) {
      if (t < m.t0) continue;
      if (m.from === undefined) m.from = value[m.ch];
      value[m.ch] = m.from + (m.to - m.from) * ease((t - m.t0) / Math.max(m.t1 - m.t0, 1e-6));
    }
  }

  // Run a plan to its end at once (reduced motion, or a new press mid-plan).
  function settle(p: Plan) {
    const stops = [...new Set([...p.moves.flatMap((m) => [m.t0, m.t1]), ...p.events.map((e) => e.t), p.end])].sort((a, b) => a - b);
    for (const t of stops) apply(p, t);
    draw();
  }

  function start(p: Plan) {
    if (plan) settle(plan);
    plan = p;
    clock = 0;
    if (still.matches) { settle(p); plan = null; return; }
    run();
  }

  function tick(now: number) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    if (plan) {
      clock += dt;
      apply(plan, clock);
      draw();
      if (clock >= plan.end) plan = null;
    }
    // The figure moves only in answer to the reader (DESIGN.md), so the loop
    // stops as soon as the current plan is done.
    frame = visible && plan ? requestAnimationFrame(tick) : 0;
  }

  function run() {
    if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
  }

  function choose(s: Scenario | null) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(s !== null && b.dataset.scenario === String(s.id))));
    start(s ? planFor(s) : resetPlan());
  }

  buttons.forEach((b) => b.addEventListener("click", () => choose(SCENARIOS.find((s) => String(s.id) === b.dataset.scenario) ?? null), { signal }));
  resetButton?.addEventListener("click", () => choose(null), { signal });
  stage.addEventListener("keydown", (event) => {
    const s = SCENARIOS.find((x) => String(x.id) === event.key);
    if (s) { event.preventDefault(); choose(s); }
    if (event.key === "0" || event.key.toLowerCase() === "r") { event.preventDefault(); choose(null); }
  }, { signal });

  const seen = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  }, { rootMargin: "120px 0px" });
  seen.observe(stage);

  still.addEventListener("change", () => { if (plan && still.matches) { settle(plan); plan = null; } run(); }, { signal });

  // At rest: an empty store and the first request waiting in the magazine.
  value.c1 = INLET;
  show(cards.c1, true);
  say("store empty · charges 0");
  draw();

  return () => {
    abort.abort();
    seen.disconnect();
    cancelAnimationFrame(frame);
  };
}

export type { Body };
