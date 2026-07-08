import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
    errors: defineCollection({
        loader: glob({
            base: 'src/content/errors',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            title: z.string(),
            statusCode: z.number(),
            statusText: z.string(),
            category: z.enum(['client-error', 'server-error']),
            relatedCodes: z.array(z.string()).optional(),
            publishedDate: z.date(),
            updatedDate: z.date().optional(),
            deprecated: z.boolean().optional(),
        }),
    }),
    statusCodes: defineCollection({
        loader: glob({
            base: 'src/content/status-codes',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            code: z.number(),
            title: z.string(),
            description: z.string(),
            category: z.enum(['informational', 'success', 'redirection', 'client-error', 'server-error']),
        }),
    }),
    headers: defineCollection({
        loader: glob({
            base: 'src/content/headers',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            name: z.string(),
            description: z.string(),
            category: z.enum(['request', 'response', 'both']),
            standard: z.boolean(),
            relatedCodes: z.array(z.number()).optional(),
        }),
    }),
    methods: defineCollection({
        loader: glob({
            base: 'src/content/methods',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            name: z.string(),
            description: z.string(),
            safe: z.boolean(),
            idempotent: z.boolean(),
            cacheable: z.boolean(),
            relatedCodes: z.array(z.number()).optional(),
        }),
    }),
    guides: defineCollection({
        loader: glob({
            base: 'src/content/guides',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            title: z.string(),
            description: z.string(),
            category: z.enum(['caching', 'security', 'negotiation', 'core']),
        }),
    }),
    tools: defineCollection({
        loader: glob({
            base: 'src/content/tools',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            name: z.string(),
            description: z.string(),
            category: z.enum(['observability', 'design-documentation', 'testing-mocking', 'gateways-management', 'clients-debugging']),
            lifecycleStages: z.array(z.enum(['design', 'development', 'testing', 'deployment', 'monitoring'])),
            url: z.string().url(),
            pricing: z.enum(['free', 'freemium', 'paid', 'open-source']),
        }),
    }),
    specifications: defineCollection({
        loader: glob({
            base: 'src/content/specifications',
            pattern: '**/*.{md,mdx}'
        }),
        schema: z.object({
            title: z.string(),
            description: z.string(),
            currentVersion: z.string(),
            officialUrl: z.string().url(),
        }),
    }),
};