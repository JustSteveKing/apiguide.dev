// The figure registry. A guide names a figure in its frontmatter
// (`figure: idempotency-keys`) and Figure.astro renders the entry here.
import idempotencyKeysArt from "./idempotency-keys/art.svg?raw";
import { SCENARIOS as idempotencyKeysScenarios } from "./idempotency-keys/model";
import type { FigureName } from "./names";

export interface FigureEntry {
  art: string;
  title: string;
  hint: string;
  readout: string;
  caption: string;
  controls: Array<{ id: number; label: string }>;
}

export const figures = {
  "idempotency-keys": {
    art: idempotencyKeysArt,
    title: "Idempotency key",
    hint: "Press 1 to 4",
    readout: "store empty · charges 0",
    caption:
      "A request card carries its Idempotency-Key in the holes along its edge and its body in the grid. A new key raises its tab while the press makes the charge, then the response is stored on that key's spike. A retry with the same body gets the stored response back without a second charge; a changed body is rejected with 422, and a duplicate sent while the tab is still up is rejected with 409.",
    controls: idempotencyKeysScenarios.map(({ id, label }) => ({ id, label })),
  },
} satisfies Record<FigureName, FigureEntry>;

export type { FigureName };
