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

export const guideCategoryThemes = {
  'caching': {
    badge: 'bg-ochre-100 text-ochre-900 border-ochre-200 border',
    label: 'API Caching'
  },
  'security': {
    badge: 'bg-uranium-100 text-uranium-900 border-uranium-200 border',
    label: 'API Security'
  },
  'negotiation': {
    badge: 'bg-yinmn-100 text-yinmn-900 border-yinmn-200 border',
    label: 'Content Negotiation'
  },
  'core': {
    badge: 'bg-paper-200 text-paper-800 border-paper-300 border',
    label: 'API Core'
  }
} as const;

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
  'gateways-management': 'hover:border-ochre-400 bg-paper-100 dark:bg-paper-900 hover:bg-ochre-50 dark:hover:bg-ochre-950',
  'observability': 'hover:border-uranium-400 bg-paper-100/50 hover:bg-uranium-50/10'
} as const;
