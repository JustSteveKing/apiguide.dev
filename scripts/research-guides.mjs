#!/usr/bin/env node
// Phase 1 of guide creation: run Tabstack research for each planned guide and
// save the cited report to scripts/out/guide-research/<slug>.json for an
// authoring step to consume. Research only — writes nothing to src/.
//
// Usage: npm run research:guides            # all
//        npm run research:guides -- compression patch-strategies
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { research, pool } from './lib/tabstack.mjs';

const OUT_DIR = join(process.cwd(), 'scripts/out/guide-research');
const CONCURRENCY = 3;

// slug → { title, category, focus }. category ∈ caching|security|negotiation|core
export const GUIDES = [
  // Caching
  { slug: 'conditional-requests', title: 'Conditional Requests & Validation', category: 'caching', focus: 'ETag/If-None-Match, Last-Modified/If-Modified-Since, 304 Not Modified, If-Match/412, strong vs weak validators' },
  { slug: 'cdn-edge-caching', title: 'CDN & Edge Caching for APIs', category: 'caching', focus: 'shared vs private caches, s-maxage, Vary, surrogate keys, purging, stale-while-revalidate' },
  { slug: 'cache-invalidation', title: 'Cache Invalidation Strategies', category: 'caching', focus: 'TTL vs event-based invalidation, versioned URLs, tag/key-based purge, stale-while-revalidate/stale-if-error' },
  // Negotiation
  { slug: 'compression', title: 'HTTP Compression', category: 'negotiation', focus: 'Accept-Encoding/Content-Encoding, gzip/br/zstd/deflate, when to compress, Vary, BREACH risks, minimum sizes' },
  { slug: 'internationalization', title: 'Internationalization & Localization', category: 'negotiation', focus: 'Accept-Language/Content-Language, locale negotiation, message vs data localization, timezones and formats' },
  { slug: 'media-types', title: 'Media Types & Vendor Content Types', category: 'negotiation', focus: 'application/vnd.*+json, +json structured suffix, versioning via media type, Accept/Content-Type, parameters' },
  // Security
  { slug: 'webhook-signatures', title: 'Webhook Signature Verification', category: 'security', focus: 'HMAC-SHA256 signatures, signing secrets, timestamp/replay protection, constant-time comparison, header conventions' },
  { slug: 'request-signing', title: 'Request Signing', category: 'security', focus: 'HMAC request signing, AWS SigV4-style canonical requests, signed headers, clock skew, body digests' },
  { slug: 'token-lifecycle', title: 'Token Lifecycle: Rotation, Refresh & Revocation', category: 'security', focus: 'short-lived access tokens, refresh tokens, rotation, revocation lists, token introspection, key rotation (JWKS)' },
  { slug: 'authorization-models', title: 'Authorization Models: RBAC & ABAC', category: 'security', focus: 'RBAC vs ABAC vs ReBAC, OAuth scopes, object-level authorization (BOLA), policy engines, least privilege' },
  { slug: 'mutual-tls', title: 'mTLS & Client Certificates', category: 'security', focus: 'mutual TLS, client certificate auth, service-to-service, certificate rotation, mTLS vs bearer tokens' },
  { slug: 'input-validation', title: 'Input Validation & Injection Prevention', category: 'security', focus: 'schema validation, allowlists, injection (SQL/NoSQL/command), mass assignment, size limits, canonicalization' },
  // Core
  { slug: 'patch-strategies', title: 'PATCH Strategies: JSON Patch vs Merge Patch', category: 'core', focus: 'JSON Patch (RFC 6902) operations, JSON Merge Patch (RFC 7386), null semantics, media types, when to use each' },
  { slug: 'retries-backoff', title: 'Retries, Backoff & Resilience', category: 'core', focus: 'idempotent retries, exponential backoff with jitter, Retry-After, circuit breakers, timeouts, safe retry conditions' },
  { slug: 'file-uploads-downloads', title: 'File Uploads & Downloads', category: 'core', focus: 'multipart/form-data, direct/presigned uploads, resumable uploads, Range requests, Content-Disposition, streaming' },
  { slug: 'deprecation-sunsetting', title: 'API Deprecation & Sunsetting', category: 'core', focus: 'Deprecation (RFC 9745) and Sunset (RFC 8594) headers, Link rel, migration timelines, communication' },
  { slug: 'health-checks', title: 'Health Checks & Status Endpoints', category: 'core', focus: 'liveness vs readiness, /health endpoints, health+json draft, dependency checks, status pages' },
  { slug: 'response-envelopes', title: 'Response Envelope Design', category: 'core', focus: 'data/meta/errors wrapping vs bare bodies, pagination metadata, consistency, tradeoffs' },
  { slug: 'streaming-apis', title: 'Streaming APIs: SSE, WebSocket & Long-Polling', category: 'core', focus: 'Server-Sent Events vs WebSocket vs long-polling, when to use each, reconnection, scaling' },
  { slug: 'multi-tenancy', title: 'Multi-Tenancy Patterns', category: 'core', focus: 'tenant isolation (silo/pool/bridge), tenant routing (subdomain/header/path), data partitioning, noisy neighbor' },
];

function query(g) {
  return (
    `${g.title} for HTTP/REST APIs. Cover current best practices, the relevant RFCs and standards, ` +
    `common implementation patterns, and pitfalls. Specifically address: ${g.focus}. ` +
    `Prioritize accurate, standards-grounded, practical guidance for API designers.`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const guides = args.length ? GUIDES.filter((g) => args.includes(g.slug)) : GUIDES;
  if (!guides.length) {
    console.error('No matching guide slugs.');
    process.exit(2);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Researching ${guides.length} guide(s) → ${OUT_DIR}\n`);

  await pool(guides, CONCURRENCY, async (g) => {
    try {
      const { report, citedPages } = await research(query(g), 'balanced');
      writeFileSync(
        join(OUT_DIR, `${g.slug}.json`),
        JSON.stringify({ slug: g.slug, title: g.title, category: g.category, focus: g.focus, report, citedPages }, null, 2)
      );
      console.log(`  ✓ ${g.slug}  (${report.length} chars, ${citedPages?.length ?? 0} sources)`);
    } catch (e) {
      console.log(`  ✗ ${g.slug}: ${e.message}`);
    }
  });
  console.log('\nResearch done. Author guides from scripts/out/guide-research/*.json next.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
