// The Markdown sibling of each section's index page, such as /errors.md.
import type { APIRoute, GetStaticPaths } from 'astro';
import { SECTIONS, allEntries, inSection, markdownResponse, sectionIndex, type Section } from '@/utils/markdown';

export const getStaticPaths = (() =>
  SECTIONS.map((section) => ({ params: { section: section.slug }, props: { section } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const section = props.section as Section;
  return markdownResponse(sectionIndex(section, inSection(await allEntries(), section)));
};
