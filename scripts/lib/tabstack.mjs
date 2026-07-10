// Thin wrapper around the Tabstack CLI (`tabstack`), which handles auth itself
// (API key resolved from env or ~/.config/tabstack/config.toml). Override the
// binary with TABSTACK_BIN. All calls request `-o json`.
import { spawn } from 'node:child_process';

const BIN = process.env.TABSTACK_BIN ?? 'tabstack';

function runRaw(args, { input, timeoutMs = 120_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(BIN, [...args, '-o', 'json'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`tabstack ${args[0]} ${args[1] ?? ''} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(
        e.code === 'ENOENT'
          ? new Error(`'${BIN}' not found — install the Tabstack CLI or set TABSTACK_BIN.`)
          : e
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`tabstack ${args.join(' ')} exited ${code}: ${(err || out).slice(0, 400)}`));
    });
    if (input != null) child.stdin.write(input);
    child.stdin.end();
  });
}

// extract json <url> --schema -   →  the object matching the schema
export async function extractJson(url, schema, { effort } = {}) {
  const args = ['extract', 'json', url, '--schema', '-'];
  if (effort) args.push('--effort', effort);
  const out = await runRaw(args, { input: JSON.stringify(schema), timeoutMs: 180_000 });
  return JSON.parse(out);
}

// generate json <url> --instructions … --schema …  →  AI-transformed object
export async function generateJson(url, instructions, schema, { effort } = {}) {
  const args = ['generate', 'json', url, '--instructions', instructions, '--schema', '-'];
  if (effort) args.push('--effort', effort);
  const out = await runRaw(args, { input: JSON.stringify(schema), timeoutMs: 180_000 });
  return JSON.parse(out);
}

// extract markdown <url>  →  { content, url }
export async function extractMarkdown(url) {
  const out = await runRaw(['extract', 'markdown', url], { timeoutMs: 120_000 });
  return JSON.parse(out);
}

// agent research <query>  →  streams NDJSON events; the final `complete`
// event carries { report, metadata: { citedPages } }.
export async function research(query, mode = 'fast') {
  const out = await runRaw(['agent', 'research', query, '--mode', mode], { timeoutMs: 240_000 });
  let report = '';
  let citedPages = [];
  for (const line of out.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let evt;
    try {
      evt = JSON.parse(t);
    } catch {
      continue;
    }
    if (evt.event === 'complete') {
      report = evt.data?.report ?? '';
      citedPages = evt.data?.metadata?.citedPages ?? [];
    }
  }
  return { report, citedPages };
}

// Run async tasks with a concurrency cap; preserves input order.
export async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i], i);
      }
    })
  );
  return results;
}
