/**
 * `marker` is the left rule beside a page's wire line (WireHero). It is a fill,
 * not text, so step 500 is allowed; see DESIGN.md, "Contrast floors".
 */
export const statusCategoryThemes = {
  'informational': {
    badge: 'bg-slate-100 text-slate-900 border-slate-200 border',
    label: 'Informational (1xx)',
    cardHover: 'hover:border-slate-300 hover:bg-slate-50/10',
    marker: 'border-slate-500'
  },
  'success': {
    badge: 'bg-green-100 text-green-900 border-green-200 border',
    label: 'Success (2xx)',
    cardHover: 'hover:border-green-300 hover:bg-green-50/10',
    marker: 'border-green-500'
  },
  'redirection': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Redirection (3xx)',
    cardHover: 'hover:border-violet-300 hover:bg-violet-50/10',
    marker: 'border-violet-500'
  },
  'client-error': {
    badge: 'bg-amber-100 text-amber-900 border-amber-200 border',
    label: 'Client Error (4xx)',
    cardHover: 'hover:border-amber-300 hover:bg-amber-50/10',
    marker: 'border-amber-500'
  },
  'server-error': {
    badge: 'bg-red-100 text-red-900 border-red-200 border',
    label: 'Server Error (5xx)',
    cardHover: 'hover:border-red-300 hover:bg-red-50/10',
    marker: 'border-red-500'
  }
} as const;

export const errorCategoryThemes = {
  'client-error': {
    badge: 'bg-amber-100 text-amber-900 border-amber-200 border',
    label: 'Client Error (4xx)',
    cardHover: 'hover:border-amber-300 hover:bg-amber-50/10',
    marker: 'border-amber-500'
  },
  'server-error': {
    badge: 'bg-red-100 text-red-900 border-red-200 border',
    label: 'Server Error (5xx)',
    cardHover: 'hover:border-red-300 hover:bg-red-50/10',
    marker: 'border-red-500'
  }
} as const;

export const headerCategoryThemes = {
  'request': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Request Header',
    marker: 'border-violet-500'
  },
  'response': {
    badge: 'bg-ultra-100 text-ultra-900 border-ultra-200 border',
    label: 'Response Header',
    marker: 'border-ultra-500'
  },
  'both': {
    badge: 'bg-slate-200 text-slate-900 border-slate-300 border',
    label: 'Bidirectional (Request/Response)',
    marker: 'border-slate-500'
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
 * Tool categories follow the guide rule: no amber, red or green. Two
 * hue pairs, solid against outline, for the build-time and run-time halves
 * of the lifecycle, and slate for observability, which watches both.
 */
/** Reading order for tool categories: build-time first, then run-time. */
export const toolCategories = ['design-documentation', 'testing-mocking', 'clients-debugging', 'gateways-management', 'observability'] as const;

export const toolCategoryThemes = {
  'design-documentation': {
    badge: 'bg-violet-100 text-violet-900 border-violet-200 border',
    label: 'Design & Documentation',
    blurb: 'Write, lint and publish API descriptions such as OpenAPI and AsyncAPI.'
  },
  'testing-mocking': {
    badge: 'text-violet-800 border-violet-400 border',
    label: 'Testing & Mocking',
    blurb: 'Mock servers, contract tests and load tests.'
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
  'observability': {
    badge: 'bg-slate-200 text-slate-900 border-slate-300 border',
    label: 'Observability & Monitoring',
    blurb: 'Trace, log and measure an API in production.'
  }
} as const;

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

export const toolCategoryHoverThemes = {
  'design-documentation': 'hover:border-violet-400 bg-slate-100/50 hover:bg-violet-50/10',
  'testing-mocking': 'hover:border-violet-400 bg-slate-100/50 hover:bg-violet-50/10',
  'clients-debugging': 'hover:border-ultra-400 bg-slate-100/50 hover:bg-ultra-50/10',
  'gateways-management': 'hover:border-ultra-400 bg-slate-100/50 hover:bg-ultra-50/10',
  'observability': 'hover:border-slate-400 bg-slate-100/50 hover:bg-slate-50/10'
} as const;
