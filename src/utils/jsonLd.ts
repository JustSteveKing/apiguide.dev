/**
 * Centralized JSON-LD Schema Generators for apiguide.dev
 */

const SITE_URL = "https://apiguide.dev";

export interface BreadcrumbStep {
  name: string;
  path: string;
}

export interface TechArticleOptions {
  headline: string;
  description: string;
  url: string;
  category?: string;
  publishedDate?: Date | string;
  updatedDate?: Date | string;
  aboutName?: string;
  aboutUrl?: string;
}

export interface SoftwareAppOptions {
  name: string;
  description: string;
  url: string;
  pricing: string;
  category: string;
}

const site = {
  url: "https://apiguide.dev",
  name: "apiguide.dev",
  description: "The flagship reference catalog for web API design patterns, status codes, request methods, headers, and error schemas.",
  author: "Steve McDougall",
  email: "steve@lilafuches.com",
  github: "JustSteveKing",
  linkedin: "steve-mcdougall",
  twitter: "JustSteveKing"
};

export const company = {
  "@type": "Organization" as const,
  "@id": "https://lilafuches.com/#organization",
  "name": "Lila Fuches Limited",
  "description": "Expert engineering, education, and content services for the Laravel and API ecosystem.",
  "url": "https://lilafuches.com",
  "logo": "https://lilafuches.com/images/logo.png",
  "email": "hello@lilafuches.com",
  "foundingDate": "2019",
  "areaServed": "Global",
};

export const person = {
  "@type": "Person" as const,
  "@id": `${site.url}/#identity`,
  "name": site.author,
  "url": site.url,
  "email": site.email,
  "image": `https://github.com/${site.github}.png`,
  "description": "Practical engineering education, courses, and resources for the modern PHP & Laravel developer.",
  "sameAs": [
    "https://youtube.com/juststeveking",
    `https://github.com/${site.github}`,
    `https://linkedin.com/in/${site.linkedin}`,
    `https://x.com/${site.twitter.replace('@', '')}`
  ],
  "jobTitle": "Co-Founder & Technical Lead",
  "worksFor": company
};

/**
 * Generate standard WebSite search schema for the homepage
 */
export function getWebSiteSchema() {
  return [
    {
      "@type": "WebSite" as const,
      "@id": `${site.url}/#website`,
      "name": site.name,
      "url": site.url,
      "description": site.description,
      "publisher": {
        "@id": `${site.url}/#identity`
      },
      "potentialAction": {
        "@type": "SearchAction" as const,
        "target": `${site.url}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    },
    person,
    company
  ];
}

/**
 * Generate BreadcrumbList schema representing the navigational steps
 */
export function getBreadcrumbSchema(steps: BreadcrumbStep[]) {
  const itemListElement = [
    {
      "@type": "ListItem" as const,
      "position": 1,
      "name": "Home",
      "item": SITE_URL
    },
    ...steps.map((step, index) => {
      const cleanPath = step.path.startsWith('/') ? step.path : `/${step.path}`;
      // Clean duplicate trailing slashes
      const cleanUrl = `${SITE_URL}${cleanPath}`.replace(/\/+$/, '/');
      return {
        "@type": "ListItem" as const,
        "position": index + 2,
        "name": step.name,
        "item": cleanUrl
      };
    })
  ];

  return {
    "@context": "https://schema.org" as const,
    "@type": "BreadcrumbList" as const,
    "itemListElement": itemListElement
  };
}

/**
 * Generate TechArticle schema for errors, codes, headers, methods, and guides
 */
export function getTechArticleSchema(options: TechArticleOptions) {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": options.headline,
    "description": options.description,
    "url": options.url,
    "inLanguage": "en",
    "mainEntityOfPage": options.url,
    "publisher": {
      "@type": "Organization",
      "name": "apiguide.dev",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/favicon.svg`
      }
    }
  };

  if (options.category) {
    schema["articleSection"] = options.category;
  }

  if (options.publishedDate) {
    schema["datePublished"] = typeof options.publishedDate === 'string' 
      ? options.publishedDate 
      : options.publishedDate.toISOString();
  } else {
    // Default fallback to stable baseline date if not present
    schema["datePublished"] = "2026-07-07T00:00:00Z";
  }

  if (options.updatedDate) {
    schema["dateModified"] = typeof options.updatedDate === 'string' 
      ? options.updatedDate 
      : options.updatedDate.toISOString();
  }

  if (options.aboutName && options.aboutUrl) {
    schema["about"] = {
      "@type": "CreativeWork",
      "name": options.aboutName,
      "url": options.aboutUrl
    };
  }

  return schema;
}

/**
 * Generate SoftwareApplication schema for tools pages
 */
export function getSoftwareApplicationSchema(options: SoftwareAppOptions) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "SoftwareApplication" as const,
    "name": options.name,
    "description": options.description,
    "url": options.url,
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer" as const,
      "price": "0",
      "priceCurrency": "USD",
      "category": options.pricing
    }
  };
}
