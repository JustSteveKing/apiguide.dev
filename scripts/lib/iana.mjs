// Fetch IANA registries directly. IANA publishes every registry as CSV (and
// XML) at a stable URL, so nothing needs to sit between this site and them.
const UA = 'apiguide.dev content checks (+https://apiguide.dev)';

export async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.text();
}

// RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

export async function fetchCsv(url) {
  return parseCsv(await fetchText(url));
}

export const REGISTRY_URLS = {
  statusCodes: 'https://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv',
  methods: 'https://www.iana.org/assignments/http-methods/methods.csv',
  fields: 'https://www.iana.org/assignments/http-fields/field-names.csv',
  problemTypes: 'https://www.iana.org/assignments/http-problem-types/http-problem-types.xml',
};

// The problem types registry has no CSV. Its XML is small and flat.
export async function fetchProblemTypes() {
  const xml = await fetchText(REGISTRY_URLS.problemTypes);
  return [...xml.matchAll(/<record[^>]*>([\s\S]*?)<\/record>/g)].map(([, body]) => {
    const tag = (t) => (body.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) ?? [])[1]?.trim() ?? '';
    const xref = body.match(/<xref type="([^"]+)" data="([^"]+)"(?: section="([^"]+)")?/);
    return {
      type: tag('type'),
      name: tag('name'),
      status: tag('rec'),
      reference: xref ? `${xref[2].toUpperCase()}${xref[3] ? `, Section ${xref[3]}` : ''}` : '',
    };
  });
}
