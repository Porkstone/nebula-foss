import { httpAction } from './_generated/server';
import { api } from './_generated/api';
import { categories } from './lib/policy';

const allowedParameters = new Set(['q', 'category', 'contributions', 'maintained', 'sort', 'limit', 'cursor']);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
    Link: '</openapi.json>; rel="service-desc", </llms.txt>; rel="describedby"',
  }});
}

// This API deliberately shares the website's search and eligibility checks.
// Map fields explicitly: account identifiers and refresh diagnostics stay private.
export const search = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const params = url.searchParams;
  const invalid = (message: string) => json({error: {code: 'invalid_request', message}, documentation: 'https://www.foss.codes/llms.txt'}, 400);
  for (const [name] of params) {
    if (!allowedParameters.has(name)) return invalid(`Unknown parameter: ${name}. See the documentation for supported filters.`);
    if (params.getAll(name).length > 1) return invalid(`Supply ${name} only once.`);
  }
  const search = (params.get('q') ?? '').trim();
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'stars';
  const limit = params.get('limit') ?? '20';
  if (search.length > 200) return invalid('q must contain at most 200 characters.');
  if (category && !(categories as readonly string[]).includes(category)) return invalid(`category must be one of: ${categories.join('; ')}.`);
  if (sort !== 'stars' && sort !== 'newest') return invalid('sort must be stars or newest. Text searches always use relevance order.');
  if (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50) return invalid('limit must be an integer between 1 and 50.');
  for (const name of ['contributions', 'maintained']) {
    if (params.has(name) && !['true', 'false'].includes(params.get(name)!)) return invalid(`${name} must be true or false.`);
  }
  const cursor = params.get('cursor');
  if (cursor !== null && (!cursor || cursor.length > 8192)) return invalid('cursor must be the nonempty cursor returned by the previous page.');
  try {
    const result = await ctx.runQuery(api.projects.list, {
      search, category, sort, contributions: params.get('contributions') === 'true', maintained: params.get('maintained') === 'true',
      paginationOpts: {numItems: Number(limit), cursor, maximumRowsRead: 500, maximumBytesRead: 2_000_000},
    });
    const next = new URL('https://www.foss.codes/api/v1/projects');
    next.search = params.toString();
    next.searchParams.set('cursor', result.continueCursor);
    return json({
      projects: result.page.map(project => ({
        fullName: project.fullName, repositoryUrl: `https://github.com/${project.fullName}`,
        description: project.description, category: project.category, language: project.language, license: project.license,
        stars: project.stars, forks: project.forks, contributions: project.contributions, maintained: project.maintained,
        archived: project.archived, pushedAt: project.pushedAt, addedAt: new Date(project._creationTime).toISOString(),
      })),
      order: search ? 'relevance' : sort,
      pagination: {hasMore: !result.isDone, nextCursor: result.isDone ? null : result.continueCursor, next: result.isDone ? null : next.href},
    });
  } catch (error) {
    if (cursor && error instanceof Error && /InvalidCursor|invalid cursor/i.test(error.message)) return invalid('Invalid or expired cursor. Start again without cursor and keep the same filters between pages.');
    console.error('Public directory search failed', error);
    return json({error: {code: 'search_unavailable', message: 'Project search is temporarily unavailable. Please try again.'}}, 503);
  }
});
