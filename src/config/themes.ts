export const statusCategoryThemes = {
  'informational': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Informational (1xx)',
    cardHover: 'hover:border-yinmn-300 hover:bg-yinmn-50/10'
  },
  'success': {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 border',
    label: 'Success (2xx)',
    cardHover: 'hover:border-emerald-300 hover:bg-emerald-50/10'
  },
  'redirection': {
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Redirection (3xx)',
    cardHover: 'hover:border-chartres-300 hover:bg-chartres-50/10'
  },
  'client-error': {
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'Client Error (4xx)',
    cardHover: 'hover:border-ochre-300 hover:bg-ochre-50/10'
  },
  'server-error': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'Server Error (5xx)',
    cardHover: 'hover:border-uranium-300 hover:bg-uranium-50/10'
  }
} as const;

export const errorCategoryThemes = {
  'client-error': {
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'Client Error (4xx)',
    cardHover: 'hover:border-ochre-300 hover:bg-ochre-50/10'
  },
  'server-error': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'Server Error (5xx)',
    cardHover: 'hover:border-uranium-300 hover:bg-uranium-50/10'
  }
} as const;

export const headerCategoryThemes = {
  'request': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Request Header'
  },
  'response': {
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Response Header'
  },
  'both': {
    badge: 'bg-paper-200 text-paper-900 border-paper-300 border',
    label: 'Bidirectional (Request/Response)'
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
 * There are five pigments in the palette and eight categories, so four of
 * them pair off and share a hue, solid against outline. The pairs are real
 * kinship rather than a way of running out of colours: design and evolution
 * are the contract and the contract over time, performance and
 * representation are both what HTTP negotiates about a response, and
 * reliability and events are the same delivery problem seen from each end.
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
    badge: 'text-ochre-800 border-ochre-400 border',
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
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'Performance & Caching',
    blurb: 'Not answering at all is faster than answering quickly.'
  },
  'security': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'Security & Auth',
    blurb: 'Proving who is calling, what they may do, and that nothing was tampered with.'
  },
  'agents': {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 border',
    label: 'Agents & Tool Use',
    blurb: 'What survives when your API is read by a model rather than a person.'
  }
};

export const toolCategoryThemes = {
  'design-documentation': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Design & Documentation'
  },
  'testing-mocking': {
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200 border',
    label: 'Testing & Mocking'
  },
  'clients-debugging': {
    badge: 'bg-chartres-100 text-chartres-900 border-chartres-200 border',
    label: 'Clients & Debugging'
  },
  'gateways-management': {
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'Gateways & Management'
  },
  'observability': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'Observability & Monitoring'
  }
} as const;

export const pricingThemes = {
  'free': 'bg-emerald-100 text-emerald-900 border-emerald-200 border',
  'open-source': 'bg-emerald-100 text-emerald-900 border-emerald-200 border',
  'freemium': 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
  'paid': 'bg-ochre-100 text-ochre-900 border-ochre-200 border'
} as const;

export const toolCategoryHoverThemes = {
  'design-documentation': 'hover:border-yinmn-400 bg-paper-100/50 hover:bg-yinmn-50/10',
  'testing-mocking': 'hover:border-emerald-400 bg-paper-100/50 hover:bg-emerald-50/10',
  'clients-debugging': 'hover:border-chartres-400 bg-paper-100/50 hover:bg-chartres-50/10',
  'gateways-management': 'hover:border-ochre-400 bg-paper-100 hover:bg-ochre-50',
  'observability': 'hover:border-uranium-400 bg-paper-100/50 hover:bg-uranium-50/10'
} as const;
