<wizard-report>
# PostHog post-wizard report

The wizard has completed a full PostHog analytics integration for apiguide.dev. A new `src/components/posthog.astro` component was created containing the PostHog snippet with a `window.__posthog_initialized` guard to prevent stack overflow during Astro View Transitions (ClientRouter) soft navigation. It is mounted in the shared `src/layouts/Layout.astro` layout so every page is covered automatically. Pageviews are tracked automatically via `capture_pageview: 'history_change'`, which fires on every client-side route change. Eight custom events were instrumented across five files to track search usage, catalog engagement, guide and specification consumption, and external tool conversions.

| Event name | Description | File |
|---|---|---|
| `search_opened` | User opened the command palette search overlay. | `src/components/CommandPalette.astro` |
| `search_result_clicked` | User clicked on a result returned from the command palette search. | `src/components/CommandPalette.astro` |
| `hero_search_trigger_clicked` | User clicked the hero search bar on the homepage to open the search palette. | `src/pages/index.astro` |
| `catalog_card_clicked` | User clicked on a reference directory card on the homepage. | `src/pages/index.astro` |
| `api_scenario_resource_clicked` | User clicked a related resource link within a Common API Scenario card on the homepage. | `src/pages/index.astro` |
| `guide_viewed` | User navigated to a developer guide detail page (top of guides content funnel). | `src/pages/guides/[slug].astro` |
| `external_tool_link_clicked` | User clicked the official website link on an API tool reference page. | `src/pages/tools/[category]/[slug].astro` |
| `specification_external_link_clicked` | User clicked the official specification website link on a specification detail page. | `src/pages/specifications/[slug].astro` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/49852/dashboard/804349)
- [Search-to-Click Funnel](https://eu.posthog.com/project/49852/insights/eNQneWzN)
- [Search Results by Content Type](https://eu.posthog.com/project/49852/insights/DzfSRQin)
- [Catalog Section Clicks](https://eu.posthog.com/project/49852/insights/HcEPtBmn)
- [External Tool Conversions](https://eu.posthog.com/project/49852/insights/PKQ4MBIV)
- [Key Event Trends](https://eu.posthog.com/project/49852/insights/HdEm9lfs)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `PUBLIC_POSTHOG_PROJECT_TOKEN` and `PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
