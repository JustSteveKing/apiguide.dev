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

/** An RFC's text as published. Throws if it cannot be read. */
export function rfcRaw(number) {
  if (!cache.has(number)) {
    cache.set(
      number,
      (async () => {
        const res = await fetch(`https://www.rfc-editor.org/rfc/rfc${number}.txt`, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`RFC ${number}: HTTP ${res.status}`);
        return res.text();
      })(),
    );
  }
  return cache.get(number);
}

/** The normalised text of an RFC. */
export async function rfcText(number) {
  return normalise(await rfcRaw(number));
}

/** Section number to { heading, text }. Headings start in column 0; the contents are indented. */
export async function rfcSections(number) {
  const raw = (await rfcRaw(number)).replace(/\n[^\n]*\[Page \d+\]\s*\n\f?[^\n]*\n/g, '\n');
  const sections = new Map();
  let current = null;
  for (const line of raw.split('\n')) {
    const heading = line.match(/^(\d+(?:\.\d+)*)\.?\s+(\S.*)$/);
    if (heading) {
      current = { heading: heading[2], text: '' };
      sections.set(heading[1], current);
    } else if (current) {
      current.text += `${line}\n`;
    }
  }
  return sections;
}
