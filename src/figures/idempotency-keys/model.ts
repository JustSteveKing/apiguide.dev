// The idempotency-key store, as a pure model. Everything the figure moves and
// every number it prints comes from here.
//
// Semantics follow draft-ietf-httpapi-idempotency-key-header (Section 2.7):
// a new key is processed once and its response stored; a retry with the same
// key and the same payload gets the stored response; the same key with a
// different payload is 422; a retry while the first request is still being
// processed is 409.

export type Body = "A" | "B";

export interface Entry {
  fingerprint: Body;
  state: "in-flight" | "done";
  status: number;
}

export type Outcome =
  | { kind: "processed"; status: 201 }
  | { kind: "replayed"; status: 201 }
  | { kind: "mismatch"; status: 422 }
  | { kind: "in-flight"; status: 409 };

export interface Store {
  entries: Record<string, Entry>;
  charges: number;
}

export const emptyStore = (): Store => ({ entries: {}, charges: 0 });

// Decide what happens to a request when it reaches the reader. A new key is
// locked (in flight) here; `finish` stores its response once processing ends.
export function arrive(store: Store, key: string, body: Body): Outcome {
  const entry = store.entries[key];
  if (!entry) {
    store.entries[key] = { fingerprint: body, state: "in-flight", status: 0 };
    return { kind: "processed", status: 201 };
  }
  if (entry.state === "in-flight") return { kind: "in-flight", status: 409 };
  if (entry.fingerprint !== body) return { kind: "mismatch", status: 422 };
  return { kind: "replayed", status: 201 };
}

// The side effect runs exactly once per new key: the charge.
export function finish(store: Store, key: string) {
  const entry = store.entries[key];
  if (!entry || entry.state !== "in-flight") return;
  store.charges += 1;
  entry.state = "done";
  entry.status = 201;
}

export interface Scenario {
  id: number;
  label: string;
  key: string;
  body: Body;
  // A second request with the same key, sent while the first is in flight.
  duplicate?: boolean;
}

export const KEY = "a1f3";
export const KEY_2 = "c702";

export const SCENARIOS: Scenario[] = [
  { id: 1, label: "Send", key: KEY, body: "A" },
  { id: 2, label: "Retry, same body", key: KEY, body: "A" },
  { id: 3, label: "Retry, changed body", key: KEY, body: "B" },
  { id: 4, label: "Retry while in flight", key: KEY_2, body: "A", duplicate: true },
];

export const STATUS_TEXT: Record<number, string> = {
  201: "201 Created",
  409: "409 Conflict",
  422: "422 Unprocessable Content",
};

export function describe(outcome: Outcome) {
  switch (outcome.kind) {
    case "processed":
      return "processed";
    case "replayed":
      return "replayed";
    case "mismatch":
      return "body differs";
    case "in-flight":
      return "still in flight";
  }
}
