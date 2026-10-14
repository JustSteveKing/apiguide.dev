// Figure names, kept apart from the registry so the content schema can
// validate `figure:` without importing any art.
export const figureNames = ["idempotency-keys"] as const;

export type FigureName = (typeof figureNames)[number];
