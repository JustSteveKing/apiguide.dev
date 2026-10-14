// Builds the static art for the idempotency-key figure.
//
//   bun src/figures/idempotency-keys/build.ts
//
// Writes art.svg (every part at rest, moving parts in data-part groups) and
// layout.json (the projection and the stations the live code moves between).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

const WIDTH = 600;
const HEIGHT = 360;

// World layout, in units of about 1 px. x runs along the bench, y toward the
// viewer, z up.
const PLATE = { x: -150, y: -78, w: 300, d: 128, r: 8 };
const PLATE_H = 12;
const FOOT_H = 5;

const RAILS = [-11, 9];
const RAIL_FROM = -146;
const RAIL_TO = 96;
const RAIL_H = 3;

const CARD = { x: -17, y: -11, w: 34, d: 24, r: 1.2 };
const CARD_T = 1.2;

const INLET = -118;
const READER = -66;
const PRESS = 2;
const TRAY_AT = 122;

const TRAY = { x: 98, y: -15, w: 48, d: 32, r: 2 };
const TRAY_FLOOR = 2;

const PIN_YS = [-5, 0, 5];
const PIN_REST = 9.4;
const PIN_READ = RAIL_H + CARD_T + 0.1;
const BLOCK_Z = 22;

const RAM_Y = 1;
const RAM_REST = 24;
const RAM_PRESS = RAIL_H + CARD_T + 0.1;
const BUSHING_Z = 56;
const ARM_Z = 66;
const ARM_TOP = 76;

const RACK = { x: 68, y: -68, w: 76, d: 18, r: 2 };
const RACK_H = 6;
const SPIKE_Y = -59;
const SPIKES = [82, 106, 130];
const SPIKE_TOP = 40;
const RECEIPT_Z = RACK_H + 3.4;
const RECEIPT_DROP = SPIKE_TOP - 4;
const TAB_REST = RACK_H + 1;
const TAB_UP = RACK_H + 9;

const COUNTER = { x: 20, y: -52, w: 40, d: 20, r: 2 };
const COUNTER_H = 24;
const LAMP = [128, -32];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [PRESS, -36, ARM_TOP + 4],
    [PRESS, RAM_Y, ARM_TOP + 4],
    [SPIKES[2], SPIKE_Y, SPIKE_TOP + 1],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 52 },
);

const at = (point: [number, number, number]) => k.iso(point, P);
const S = (paths: ReturnType<typeof k.slabOf>, style: Parameters<typeof k.solidSvg>[1] = {}) => k.solidSvg(paths, style);
const L = (d: string, style: Parameters<typeof k.lineSvg>[1] = {}) => k.lineSvg(d, style);
const D = (points: Array<[number, number] | [number, number, number]>, style: Parameters<typeof k.dotsSvg>[1] = {}) => k.dotsSvg(points as never, style);
const byDepth = (points: Array<[number, number]>) =>
  [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));

  // A ruler along the front edge, under the card's travel.
  const strip = { x: -136, y: PLATE.y + PLATE.d - 14, w: 272, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));

  // Station marks on the ruler: inlet, reader, press, tray.
  for (const x of [INLET, READER, PRESS, TRAY_AT]) {
    out.push(L(k.lineOnTop([x, strip.y + 0.8], [x, strip.y + strip.d - 0.8], 0.6, P), { tone: "hi" }));
  }

  // Label plate with three rule lines standing for engraved text.
  const label = { x: -138, y: 21, w: 44, d: 12, r: 1.4 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  [30, 22, 26].forEach((w, i) => {
    const y = label.y + 4 + i * 3;
    out.push(L(k.lineOnTop([label.x + 5, y], [label.x + 5 + w, y], 0.8, P), { tone: "lo", free: true }));
  });
  out.push(D([at([label.x + 2.6, label.y + 2.6, 0.8]), at([label.x + label.w - 2.6, label.y + label.d - 2.6, 0.8])], { size: 0.45 }));
  return out.join("");
}

function rails() {
  const out: string[] = [];
  for (const y of RAILS) {
    out.push(S(k.slabOf({ x: RAIL_FROM, y, w: RAIL_TO - RAIL_FROM, d: 4, r: 1 }, 0, RAIL_H, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RAIL_FROM + 6, (RAIL_FROM + RAIL_TO) / 2, RAIL_TO - 6].map((x) => at([x, y + 2, RAIL_H])), { size: 0.4 }));
  }
  // End stop behind the inlet.
  out.push(S(k.slabOf({ x: RAIL_FROM - 5, y: -15, w: 5, d: 32, r: 1.2 }, 0, 8, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([RAIL_FROM - 2.5, -11, 8]), at([RAIL_FROM - 2.5, 13, 8])], { size: 0.45 }));
  return out.join("");
}

function trayBack() {
  const out = [S(k.slabOf(TRAY, 0, TRAY_FLOOR, P, 4, 0.5), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(TRAY, 3), TRAY_FLOOR, P, 4), { tone: "faint" }));
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 2, r: 0.8 }, TRAY_FLOOR, 5, P, 2), { tone: "mid" }));
  return out.join("");
}

function trayFront() {
  const out = [S(k.slabOf({ x: TRAY.x + TRAY.w - 2, y: TRAY.y + 2, w: 2, d: TRAY.d - 2, r: 0.8 }, TRAY_FLOOR, 5, P, 2), { tone: "mid" })];
  out.push(S(k.slabOf({ x: TRAY.x, y: TRAY.y + TRAY.d - 2, w: TRAY.w, d: 2, r: 0.8 }, TRAY_FLOOR, 5, P, 2), { tone: "mid" }));
  out.push(D([at([TRAY.x + 4, TRAY.y + TRAY.d - 1, TRAY_FLOOR + 5]), at([TRAY.x + TRAY.w - 4, TRAY.y + TRAY.d - 1, TRAY_FLOOR + 5])], { size: 0.45 }));
  return out.join("");
}

function readerPost(y: number) {
  return [
    S(k.cylinder(READER, y, 4.6, 0, 3, P, 24), { tone: "mid" }),
    S(k.cylinder(READER, y, 3, 3, 33, P, 24), { tone: "mid", crease: "none" }),
    L(k.sideArc(READER, y, 3, 14, P, 14), { tone: "faint" }),
  ].join("");
}

// The request card, built at x = 0 and moved along the rails. Holes near the
// far edge are the key; the grid in the middle is the body's fingerprint.
const KEY_HOLES: Array<[number, number]> = [[-12, -7.5], [-9, -7.5], [-3, -7.5]];
const BODY_HOLES: Record<"A" | "B", Array<[number, number]>> = {
  A: [[2, -1], [6, -1], [10, 3], [2, 7], [6, 7]],
  B: [[2, 3], [6, -1], [10, -1], [10, 7], [6, 3]],
};

function card(id: string, shown: boolean) {
  const top = RAIL_H + CARD_T;
  const out = [`<g data-part="${id}" data-body="A" transform="${k.translateAlong(P, [INLET, 0, 0])}" style="opacity:${shown ? 1 : 0}">`];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CARD, 2), RAIL_H, 0.1, P)}" style="filter:blur(3px)"/>`);
  out.push(`<g data-lit-solid>${S(k.slabOf(CARD, RAIL_H, CARD_T, P, 3, 0.4), { tone: "hi", crease: "lo", lit: true })}</g>`);
  out.push(L(k.lineOnTop([CARD.x, -4.5], [CARD.x + CARD.w, -4.5], top, P), { tone: "faint" }));
  out.push(D(KEY_HOLES.map(([x, y]) => at([x, y, top])), { size: 0.75, tone: "hi" }));
  for (const body of ["A", "B"] as const) {
    out.push(`<g data-holes="${body}">${D(BODY_HOLES[body].map(([x, y]) => at([x, y, top])), { size: 0.75, tone: "hi" })}</g>`);
  }
  out.push(`</g>`);
  return out.join("");
}

function pins() {
  // Built at the read height, long enough that their tops stay inside the
  // block when they lift.
  const out = [`<g data-part="pins" transform="${k.translateAlong(P, [0, 0, PIN_REST - PIN_READ])}">`];
  for (const y of PIN_YS) {
    out.push(S(k.cylinder(READER, y, 1.1, PIN_READ, BLOCK_Z + 2 - PIN_READ, P, 14), { tone: "hi", crease: "none" }));
  }
  out.push(`</g>`);
  return out.join("");
}

function readerBlock() {
  const block = { x: READER - 5, y: -10, w: 10, d: 20, r: 1.2 };
  return S(k.slabOf(block, BLOCK_Z, 36 - BLOCK_Z, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(block, BLOCK_Z + 4, P, 3), { tone: "faint" }) });
}

function readerBridge() {
  const bridge = { x: READER - 6, y: -24, w: 12, d: 50, r: 1.6 };
  return [
    S(k.slabOf(bridge, 36, 6, P, 4, 0.6), { tone: "mid" }),
    D([at([READER, -20, 42]), at([READER, 22, 42])], { size: 0.5 }),
    S(k.cylinder(READER + 2, 10, 2.4, 42, 4, P, 18), { tone: "mid" }),
    L(k.knurl(READER + 2, 10, 2.4, 42, 46, 16, P), { tone: "lo" }),
  ].join("");
}

function pressBack() {
  const foot = { x: PRESS - 12, y: -50, w: 24, d: 26, r: 2 };
  return [
    S(k.slabOf(foot, 0, 6, P, 4, 0.6), { tone: "mid" }),
    D(k.corners(foot, 3.5).map(([x, y]) => at([x, y, 6])), { size: 0.45 }),
    S(k.cylinder(PRESS, -37, 7, 6, 3, P, 28), { tone: "mid" }),
    S(k.cylinder(PRESS, -37, 5, 9, ARM_Z - 9, P, 28), { tone: "mid", crease: "none" }),
    L([24, 44].map((z) => k.sideArc(PRESS, -37, 5, z, P, 18)).join(""), { tone: "faint" }),
  ].join("");
}

function ram() {
  const out = [`<g data-part="ram" transform="${k.translateAlong(P, [0, 0, RAM_REST - RAM_PRESS])}">`];
  out.push(S(k.cylinder(PRESS, RAM_Y, 3.2, RAM_PRESS + 2.4, BUSHING_Z + 2 - RAM_PRESS - 2.4, P, 20), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(PRESS, RAM_Y, 7, RAM_PRESS, 2.4, P, 32, 0.4), { tone: "hi" }));
  out.push(L(k.ring(PRESS, RAM_Y, 4.4, RAM_PRESS + 2.4, P, 24), { tone: "faint" }));
  out.push(`</g>`);
  return out.join("");
}

function pressTop() {
  const arm = { x: PRESS - 7, y: -42, w: 14, d: 50, r: 2 };
  return [
    S(k.cylinder(PRESS, RAM_Y, 6, BUSHING_Z, ARM_Z - BUSHING_Z, P, 28), { tone: "mid" }),
    L(k.sideArc(PRESS, RAM_Y, 6, BUSHING_Z + 3, P, 20), { tone: "faint" }),
    S(k.slabOf(arm, ARM_Z, ARM_TOP - ARM_Z, P, 4, 0.8), { tone: "mid" }),
    L(k.sideSeam(arm, ARM_Z + 3, P, 4), { tone: "faint" }),
    D([at([PRESS, -36, ARM_TOP]), at([PRESS, 4, ARM_TOP])], { size: 0.5 }),
    S(k.cylinder(PRESS, -16, 8, ARM_TOP, 3, P, 36), { tone: "mid" }),
    L(k.knurl(PRESS, -16, 8, ARM_TOP, ARM_TOP + 3, 40, P), { tone: "lo" }),
    L(k.lineOnTop([PRESS, -16], [PRESS + 8, -16], ARM_TOP + 3, P), { tone: "hi" }),
    D([at([PRESS, -16, ARM_TOP + 3])], { size: 0.6, tone: "hi" }),
  ].join("");
}

function rack() {
  const out = [S(k.slabOf(RACK, 0, RACK_H, P, 4, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(RACK, 2.6), RACK_H, P, 4), { tone: "faint" }));
  out.push(D([at([RACK.x + 3, RACK.y + 3, RACK_H]), at([RACK.x + RACK.w - 3, RACK.y + RACK.d - 3, RACK_H])], { size: 0.45 }));
  SPIKES.forEach((x, i) => {
    out.push(S(k.cylinder(x, SPIKE_Y, 4, RACK_H, 3, P, 24), { tone: "mid" }));
    out.push(S(k.cylinder(x, SPIKE_Y, 0.8, RACK_H + 3, SPIKE_TOP - RACK_H - 3, P, 12), { tone: "hi", crease: "none" }));
    out.push(D([at([x, SPIKE_Y, SPIKE_TOP])], { size: 0.6, tone: "hi" }));
    // The in-flight tab: a slide on a short post beside the spike.
    const post = [x + 8, SPIKE_Y - 3] as const;
    out.push(S(k.cylinder(post[0], post[1], 0.9, RACK_H, 14, P, 12), { tone: "mid", crease: "none" }));
    out.push(`<g data-part="tab-${i}">${S(k.slabOf({ x: post[0] - 1.6, y: post[1] - 0.2, w: 3.2, d: 7, r: 0.6 }, TAB_REST, 4, P, 2, 0.3), { tone: "hi" })}</g>`);
  });
  return out.join("");
}

// A receipt impaled on a spike: built at the stack height, moved up and down
// the spike. It carries its own short piece of spike above it, so the spike
// stays in front of the receipt's far half.
function receipt(i: number, shown: boolean) {
  const x = SPIKES[i];
  const plan = { x: x - 10, y: SPIKE_Y - 7, w: 20, d: 14, r: 0.8 };
  return [
    `<g data-part="receipt-${i}" style="opacity:${shown ? 1 : 0}">`,
    S(k.slabOf(plan, RECEIPT_Z, 0.8, P, 2, 0.3), { tone: "hi", crease: "lo" }),
    L([3, 6].map((dy) => k.lineOnTop([plan.x + 3, plan.y + dy + 2], [plan.x + 3 + (dy === 3 ? 9 : 6), plan.y + dy + 2], RECEIPT_Z + 0.8, P)).join(""), { tone: "lo", free: true }),
    S(k.cylinder(x, SPIKE_Y, 0.8, RECEIPT_Z + 0.8, 4.5, P, 12), { tone: "hi", crease: "none" }),
    `</g>`,
  ].join("");
}

function counter() {
  const front = COUNTER.y + COUNTER.d;
  const out = [`<path class="iso-halo" d="${k.haloOf(COUNTER, 0, COUNTER_H, P)}" style="opacity:.5"/>`];
  out.push(S(k.slabOf(COUNTER, 0, COUNTER_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(COUNTER, 6, P, 4), { tone: "faint" }) }));
  out.push(D(k.corners(COUNTER, 3.4).map(([x, y]) => at([x, y, COUNTER_H])), { size: 0.45 }));
  // The digit window, in the plane of the front face.
  const cx = COUNTER.x + COUNTER.w / 2;
  const win = { w: 30, h: 10 };
  const m = k.sideMatrix([cx - win.w / 2, front + 0.01], 16, P, "left");
  out.push(`<g transform="${m}"><rect class="fig-window" x="0" y="0" width="${win.w}" height="${win.h}" rx="1"/><rect class="iso-line" data-tone="lo" x="0" y="0" width="${win.w}" height="${win.h}" rx="1" fill="none"/></g>`);
  out.push(`<text data-part="digits" class="fig-digits" transform="${k.sideMatrix([cx, front + 0.02], 8.1, P, "left")}" font-size="7.4" text-anchor="middle">0000</text>`);
  // Crank on the +x face.
  const crank: [number, number] = [COUNTER.x + COUNTER.w + 3, COUNTER.y + 10];
  out.push(S(k.slabOf({ x: COUNTER.x + COUNTER.w, y: crank[1] - 1.6, w: 3, d: 3.2, r: 0.8 }, 12, 3.2, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(crank[0] + 2.4, crank[1], 3, 10, 7, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(crank[0] + 2.4, crank[1], 3, 10, 17, 18, P), { tone: "lo" }));
  return out.join("");
}

function lamp() {
  const [x, y] = LAMP;
  return [
    `<path class="iso-halo" d="${k.haloOf({ x: x - 7, y: y - 7, w: 14, d: 14, r: 7 }, 0, 3, P)}" style="opacity:.5"/>`,
    S(k.cylinder(x, y, 7, 0, 3, P, 32), { tone: "lo" }),
    S(k.cylinder(x, y, 4.6, 3, 9, P, 28), { tone: "mid" }),
    L(k.sideArc(x, y, 4.6, 7, P, 18), { tone: "faint" }),
    `<g data-part="lamp" class="fig-lamp">${S(k.cylinder(x, y, 4.6, 12, 3.4, P, 28, 0.4), { tone: "hi" })}</g>`,
  ].join("");
}

// Rounds each corner of a world-space polyline with a circular-ish bend.
function fillet(points: Array<[number, number, number]>, radius: number, steps = 8) {
  const out: Array<[number, number, number]> = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const toward = (p: number[], q: number[], d: number) => {
      const v = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const len = Math.hypot(v[0], v[1], v[2]);
      return [p[0] + (v[0] / len) * d, p[1] + (v[1] / len) * d, p[2] + (v[2] / len) * d] as [number, number, number];
    };
    const r = Math.min(radius, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 0.48, Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]) * 0.48);
    const p0 = toward(b, a, r);
    const p1 = toward(b, c, r);
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const u = 1 - t;
      out.push([0, 1, 2].map((n) => u * u * p0[n] + 2 * u * t * b[n] + t * t * p1[n]) as [number, number, number]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function cable() {
  // A Bowden cable from the press arm down to the counter: it leaves the
  // arm's side, runs along it, and drops onto the counter's top.
  const route = fillet(
    [
      [PRESS + 7, -30, ARM_Z + 5],
      [COUNTER.x + 8, -30, ARM_Z + 5],
      [COUNTER.x + 8, COUNTER.y + 8, ARM_Z + 5],
      [COUNTER.x + 8, COUNTER.y + 8, COUNTER_H],
    ],
    9,
  );
  const screen = route.map(at);
  return k.wireSvg(screen[0], screen[screen.length - 1], { via: screen.slice(1, -1), tone: "mid" });
}

// The magazine at the inlet: two low side guides the waiting cards sit between.
function magazine() {
  return [-17, 15].map((y) => {
    const plan = { x: INLET - 22, y, w: 30, d: 3, r: 0.8 };
    return S(k.slabOf(plan, 0, 9, P, 2, 0.4), { tone: "mid" }) + D([at([plan.x + 4, y + 1.5, 9]), at([plan.x + plan.w - 4, y + 1.5, 9])], { size: 0.45 });
  });
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A ticket press on a bench. A request card rides two rails past a key reader to a press; every stroke of the press turns a charge counter. At the back, a rack of spikes holds one receipt per idempotency key, each with a tab that rises while a request with that key is in flight. A lamp by the out tray shows the response class.",
  body: [
    base(),
    rack(),
    receipt(0, true),
    receipt(1, false),
    receipt(2, false),
    lamp(),
    pressBack(),
    counter(),
    trayBack(),
    rails(),
    readerPost(-20),
    magazine()[0],
    `<g data-layer="cards">${card("card-2", false)}${card("card-1", true)}</g>`,
    magazine()[1],
    pins(),
    ram(),
    readerBlock(),
    readerPost(22),
    readerBridge(),
    pressTop(),
    cable(),
    trayFront(),
  ],
});

const layout = {
  P,
  stations: { INLET, READER, PRESS, TRAY_AT, RAIL_TO, TRAY_X: TRAY.x },
  heights: { RAIL_H, TRAY_FLOOR, PIN_REST, PIN_READ, RAM_REST, RAM_PRESS, RECEIPT_Z, RECEIPT_DROP, TAB_REST, TAB_UP },
};

writeFileSync(join(HERE, "art.svg"), svg);
writeFileSync(join(HERE, "layout.json"), JSON.stringify(layout, null, 2) + "\n");
console.log(`wrote art.svg (${(svg.length / 1024).toFixed(1)} KB) and layout.json`);
