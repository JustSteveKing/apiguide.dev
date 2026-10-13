/**
 * `marker` is the left rule beside a page's wire line (WireHero). It is a fill,
 * not text, so step 500 is allowed; see DESIGN.md, "Contrast floors".
 */
export const statusCategoryThemes = {
  'informational': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Informational (1xx)',
    cardHover: 'hover:border-yinmn-300 hover:bg-yinmn-50/10',
    marker: 'border-yinmn-500'
  },
  'success': {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 border',
    label: 'Success (2xx)',
    cardHover: 'hover:border-emerald-300 hover:bg-emerald-50/10',
    marker: 'border-emerald-500'
  },
  'redirection': {
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Redirection (3xx)',
    cardHover: 'hover:border-chartres-300 hover:bg-chartres-50/10',
    marker: 'border-chartres-500'
  },
  'client-error': {
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'Client Error (4xx)',
    cardHover: 'hover:border-ochre-300 hover:bg-ochre-50/10',
    marker: 'border-ochre-500'
  },
  'server-error': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'Server Error (5xx)',
    cardHover: 'hover:border-uranium-300 hover:bg-uranium-50/10',
    marker: 'border-uranium-500'
  }
} as const;

export const errorCategoryThemes = {
  'client-error': {
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'Client Error (4xx)',
    cardHover: 'hover:border-ochre-300 hover:bg-ochre-50/10',
    marker: 'border-ochre-500'
  },
  'server-error': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'Server Error (5xx)',
    cardHover: 'hover:border-uranium-300 hover:bg-uranium-50/10',
    marker: 'border-uranium-500'
  }
} as const;

export const headerCategoryThemes = {
  'request': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Request Header',
    marker: 'border-yinmn-500'
  },
  'response': {
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Response Header',
    marker: 'border-chartres-500'
  },
  'both': {
    badge: 'bg-paper-200 text-paper-900 border-paper-300 border',
    label: 'Bidirectional (Request/Response)',
    marker: 'border-paper-500'
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
 * Ochre, Uranium and Emerald mean client error, server error and success
 * everywhere on the site, so no category may use them: a security guide in
 * the 5xx badge reads as a failure. That leaves Chartres, YInMn and Paper,
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
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Design & Structure',
    blurb: 'What the resource surface looks like before anything is sent over it.'
  },
  'representation': {
    badge: 'text-paper-800 border-paper-400 border',
    label: 'Representation',
    blurb: 'Which bytes come back, in which format, in which language.'
  },
  'evolution': {
    badge: 'text-chartres-800 border-chartres-400 border',
    label: 'Versioning & Evolution',
    blurb: 'Changing a published contract without breaking the clients on it.'
  },
  'reliability': {
    badge: 'text-yinmn-800 border-yinmn-400 border',
    label: 'Reliability & Operations',
    blurb: 'How the API behaves when the network, the caller or the server misbehaves.'
  },
  'events': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Events & Async',
    blurb: 'Work that outlives a request, and the contracts for pushing it back.'
  },
  'performance': {
    badge: 'bg-paper-200 text-paper-900 border-paper-300 border',
    label: 'Performance & Caching',
    blurb: 'Not answering at all is faster than answering quickly.'
  },
  'security': {
    badge: 'bg-paper-800 text-paper-50 border-paper-800 border',
    label: 'Security & Auth',
    blurb: 'Proving who is calling, what they may do, and that nothing was tampered with.'
  },
  'agents': {
    badge: 'bg-chartres-700 text-chartres-50 border-chartres-700 border',
    label: 'Agents & Tool Use',
    blurb: 'What survives when your API is read by a model rather than a person.'
  }
};

/**
 * Tool categories follow the guide rule: no Ochre, Uranium or Emerald. Two
 * hue pairs, solid against outline, for the build-time and run-time halves
 * of the lifecycle, and Paper for observability, which watches both.
 */
export const toolCategoryThemes = {
  'design-documentation': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Design & Documentation'
  },
  'testing-mocking': {
    badge: 'text-yinmn-800 border-yinmn-400 border',
    label: 'Testing & Mocking'
  },
  'clients-debugging': {
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Clients & Debugging'
  },
  'gateways-management': {
    badge: 'text-chartres-800 border-chartres-400 border',
    label: 'Gateways & Management'
  },
  'observability': {
    badge: 'bg-paper-200 text-paper-900 border-paper-300 border',
    label: 'Observability & Monitoring'
  }
} as const;

/**
 * Pricing is neutral. It always sits beside a category badge, and a paid
 * tool is not a warning, which is what Ochre would have said.
 */
export const pricingThemes = {
  'free': 'text-paper-800 border-paper-400 border',
  'open-source': 'text-paper-800 border-paper-400 border',
  'freemium': 'text-paper-800 border-paper-400 border',
  'paid': 'text-paper-800 border-paper-400 border'
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
  'design-documentation': 'hover:border-yinmn-400 bg-paper-100/50 hover:bg-yinmn-50/10',
  'testing-mocking': 'hover:border-yinmn-400 bg-paper-100/50 hover:bg-yinmn-50/10',
  'clients-debugging': 'hover:border-chartres-400 bg-paper-100/50 hover:bg-chartres-50/10',
  'gateways-management': 'hover:border-chartres-400 bg-paper-100/50 hover:bg-chartres-50/10',
  'observability': 'hover:border-paper-400 bg-paper-100/50 hover:bg-paper-50/10'
} as const;
