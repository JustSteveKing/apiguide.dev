/**
 * The value of the first `Name: value` line for a header inside the page's
 * own fenced code blocks, so the page's wire line shows an example the page
 * already gives rather than one made up for the template.
 *
 * Returns undefined when the page has no such line; the caller then shows the
 * field name alone.
 */
export function headerExampleValue(body: string | undefined, name: string): string | undefined {
  if (!body) return undefined;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = new RegExp(`^\\s*${escaped}:\\s*(\\S.*?)\\s*$`, 'im');
  for (const [, block] of body.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    const match = block.match(line);
    if (match) return match[1];
  }
  return undefined;
}
