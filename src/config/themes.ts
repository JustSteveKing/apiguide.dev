/**
 * `dot` is the status mark beside a group heading and above a wire line; it is
 * a fill, so step 500 is allowed. `tone`
 * is the text colour for a code in its status hue: 700, or 800 for amber, which
 * at 700 sits at 4.49:1 on a light card.
 */
export const statusCategoryThemes = {
  'informational': {
    badge: 'bg-slate-100 text-slate-900 border-slate-200 border',
    label: 'Informational (1xx)',
    dot: 'bg-slate-500',
    tone: 'text-slate-700'
  },
  'success': {
    badge: 'bg-green-100 text-green-900 border-green-200 border',
    label: 'Success (2xx)',
    dot: 'bg-green-500',
    tone: 'text-green-700'
  },
  'redirection': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Redirection (3xx)',
    dot: 'bg-violet-500',
    tone: 'text-violet-700'
  },
  'client-error': {
    badge: 'bg-amber-100 text-amber-900 border-amber-200 border',
    label: 'Client Error (4xx)',
    dot: 'bg-amber-500',
    tone: 'text-amber-800'
  },
  'server-error': {
    badge: 'bg-red-100 text-red-900 border-red-200 border',
    label: 'Server Error (5xx)',
    dot: 'bg-red-500',
    tone: 'text-red-700'
  }
} as const;

export const errorCategoryThemes = {
  'client-error': {
    badge: 'bg-amber-100 text-amber-900 border-amber-200 border',
    label: 'Client Error (4xx)',
    dot: 'bg-amber-500',
    tone: 'text-amber-800'
  },
  'server-error': {
    badge: 'bg-red-100 text-red-900 border-red-200 border',
    label: 'Server Error (5xx)',
    dot: 'bg-red-500',
    tone: 'text-red-700'
  }
} as const;

export const headerCategoryThemes = {
  'request': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Request Header',
    dot: 'bg-violet-500',
    tone: 'text-violet-700'
  },
  'response': {
    badge: 'bg-ultra-100 text-ultra-900 border-ultra-200 border',
    label: 'Response Header',
    dot: 'bg-ultra-500',
    tone: 'text-ultra-700'
  },
  'both': {
    badge: 'bg-slate-200 text-slate-900 border-slate-300 border',
    label: 'Bidirectional (Request/Response)',
    dot: 'bg-slate-500',
    tone: 'text-slate-700'
  }
} as const;

/**
 * The eight guide categories, in reading order.
 *
 * The order is the order the guides index renders its sections in, and it is
 * a progression rather than an alphabet: the shape of the API, how it puts
 * data on the wire, how it changes, how it behaves when things go wrong, how
 * it pushes rather than waits, how it goes fast, how it stays closed, and
 * finally what a model makes of all of it.
 *
 * Amber, red and green mean client error, server error and success
 * everywhere on the site, so no category may use them: a security guide in
 * the 5xx badge reads as a failure. That leaves ultra, violet and slate,
 * each in three treatments (solid, outline, inverted).
 *
 * Three pairs share a hue, solid against outline, and the pairs are real
 * kinship rather than a way of running out of colours: design and evolution
 * are the contract and the contract over time, performance and
 * representation are both what HTTP negotiates about a response, and
 * reliability and events are the same delivery problem seen from each end.
 * Security and agents stand apart from the rest, so they take the inverted
 * treatment.
 */
export const guideCategories = [
  'design',
  'representation',
  'evolution',
  'reliability',
  'events',
  'performance',
  'security',
  'agents'
] as const;

export type GuideCategory = (typeof guideCategories)[number];

export const guideCategoryThemes: Record<
  GuideCategory,
  { badge: string; label: string; blurb: string }
> = {
  'design': {
    badge: 'bg-ultra-100 text-ultra-900 border-ultra-200 border',
    label: 'Design & Structure',
    blurb: 'What the resource surface looks like before anything is sent over it.'
  },
  'representation': {
    badge: 'text-slate-800 border-slate-400 border',
    label: 'Representation',
    blurb: 'Which bytes come back, in which format, in which language.'
  },
  'evolution': {
    badge: 'text-ultra-800 border-ultra-400 border',
    label: 'Versioning & Evolution',
    blurb: 'Changing a published contract without breaking the clients on it.'
  },
  'reliability': {
    badge: 'text-violet-800 border-violet-400 border',
    label: 'Reliability & Operations',
    blurb: 'How the API behaves when the network, the caller or the server misbehaves.'
  },
  'events': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Events & Async',
    blurb: 'Work that outlives a request, and the contracts for pushing it back.'
  },
  'performance': {
    badge: 'bg-slate-200 text-slate-900 border-slate-300 border',
    label: 'Performance & Caching',
    blurb: 'Not answering at all is faster than answering quickly.'
  },
  'security': {
    badge: 'bg-slate-800 text-slate-50 border-slate-800 border',
    label: 'Security & Auth',
    blurb: 'Proving who is calling, what they may do, and that nothing was tampered with.'
  },
  'agents': {
    badge: 'bg-ultra-700 text-ultra-50 border-ultra-700 border',
    label: 'Agents & Tool Use',
    blurb: 'What survives when your API is read by a model rather than a person.'
  }
};

/**
 * Tool categories follow the guide rule: no amber, red or green. Violet is
 * the build-time half of the lifecycle and ultra the run-time half, each in
 * three treatments: design and documentation solid, testing outline, SDK
 * generation inverted (it is the build-time output a consumer installs);
 * clients solid, gateways outline, webhook infrastructure inverted (it is
 * run-time traffic you send rather than receive). Slate is for the two that
 * cut across both halves: observability solid, and security testing
 * inverted, matching the security guides.
 */
/** Reading order for tool categories: build-time first, then run-time. */
export const toolCategories = [
  'design-documentation',
  'sdk-generation',
  'testing-mocking',
  'security-testing',
  'clients-debugging',
  'gateways-management',
  'webhooks',
  'observability'
] as const;

export type ToolCategory = (typeof toolCategories)[number];

export const toolCategoryThemes: Record<
  ToolCategory,
  { badge: string; label: string; blurb: string }
> = {
  'design-documentation': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Design & Documentation',
    blurb: 'Write, lint and publish API descriptions such as OpenAPI and AsyncAPI.'
  },
  'sdk-generation': {
    badge: 'bg-violet-700 text-violet-50 border-violet-700 border',
    label: 'SDK Generation',
    blurb: 'Generate typed client libraries from an API description.'
  },
  'testing-mocking': {
    badge: 'text-violet-800 border-violet-400 border',
    label: 'Testing & Mocking',
    blurb: 'Mock servers, contract tests and load tests.'
  },
  'security-testing': {
    badge: 'bg-slate-800 text-slate-50 border-slate-800 border',
    label: 'Security Testing',
    blurb: 'Audit API contracts and attack running APIs to find vulnerabilities before someone else does.'
  },
  'clients-debugging': {
    badge: 'bg-ultra-100 text-ultra-900 border-ultra-200 border',
    label: 'Clients & Debugging',
    blurb: 'Send requests, inspect traffic and see exactly what came back.'
  },
  'gateways-management': {
    badge: 'text-ultra-800 border-ultra-400 border',
    label: 'Gateways & Management',
    blurb: 'Sit in front of an API to route, authenticate and rate-limit its traffic.'
  },
  'webhooks': {
    badge: 'bg-ultra-700 text-ultra-50 border-ultra-700 border',
    label: 'Webhook Infrastructure',
    blurb: 'Send, receive, retry and inspect webhooks without building the delivery system yourself.'
  },
  'observability': {
    badge: 'bg-slate-200 text-slate-900 border-slate-300 border',
    label: 'Observability & Monitoring',
    blurb: 'Trace, log and measure an API in production.'
  }
};

/**
 * Pricing is neutral. It always sits beside a category badge, and a paid
 * tool is not a warning, which is what amber would have said.
 */
export const pricingThemes = {
  'free': 'text-slate-800 border-slate-400 border',
  'open-source': 'text-slate-800 border-slate-400 border',
  'freemium': 'text-slate-800 border-slate-400 border',
  'paid': 'text-slate-800 border-slate-400 border'
} as const;

/** Display names for enum values that used to rely on CSS uppercase to look like labels. */
export const pricingLabels = {
  'free': 'Free',
  'open-source': 'Open source',
  'freemium': 'Freemium',
  'paid': 'Paid'
} as const;

export const lifecycleStageLabels = {
  'design': 'Design',
  'development': 'Development',
  'testing': 'Testing',
  'deployment': 'Deployment',
  'monitoring': 'Monitoring'
} as const;
