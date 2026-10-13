/**
 * The first paragraph of a Markdown body, as plain text, cut at a word
 * boundary. Used where a collection has no `description` field (errors) and
 * a card still needs a line of copy.
 *
 * Headings and fenced code are skipped, and inline Markdown is reduced to its
 * text, so a link or a code span never shows up as raw syntax on a card.
 */
export function excerpt(body: string | undefined, max = 160): string {
  if (!body) return '';

  const paragraph =
    body
      .replace(/```[\s\S]*?```/g, '')
      .split(/\n{2,}/)
      .map(p => p.trim())
      .find(p => p && !p.startsWith('#')) ?? '';

  const text = paragraph
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images
    .replace(/[`*_]/g, '') // code spans and emphasis markers
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= max) return text;

  const cut = text.slice(0, max + 1);
  const atWord = cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.(-]+$/, '');
  return `${atWord}…`;
}
