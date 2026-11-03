// Fetch an RFC's plain text and compare quotations against it. The text version
// wraps lines, hyphenates at line ends, breaks pages and can carry change bars, so a quotation has to be
// compared with all of that normalised away.
const cache = new Map();

export function normalise(text) {
  return text
    .replace(/\n[^\n]*\[Page \d+\]\s*\n\f?[^\n]*\n/g, '\n')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\n\s*\|\s*/g, '\n')
    .replace(/-\n\s*/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** The normalised text of an RFC. Throws if it cannot be read. */
export function rfcText(number) {
  if (!cache.has(number)) {
    cache.set(
      number,
      (async () => {
        const res = await fetch(`https://www.rfc-editor.org/rfc/rfc${number}.txt`, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`RFC ${number}: HTTP ${res.status}`);
        return normalise(await res.text());
      })(),
    );
  }
  return cache.get(number);
}
