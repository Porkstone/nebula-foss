import { v, ConvexError } from 'convex/values';
import { getAuthUserId } from '@convex-dev/auth/server';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { details } from './schema';
import type { Id } from './_generated/dataModel';
import { isPermittedLicense, licensePolicyMessage, parseRepository, validateDetails } from './lib/policy';
class GitHubError extends Error { retryMs: number; unavailable: boolean; constructor(message: string, retryMs = 0, unavailable = false) { super(message); this.retryMs = retryMs; this.unavailable = unavailable; } }
export async function fetchRepository(name: string, etag?: string) {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Nebula-Open-Source-Directory' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  if (etag) headers['If-None-Match'] = etag;
  const response = await fetch(`https://api.github.com/repos/${name}`, { headers, signal: AbortSignal.timeout(15000) });
  if (response.status === 304) return null;
  if (response.status === 403 || response.status === 429) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string' ? body.message : '';
    const exhausted = response.headers.get('x-ratelimit-remaining') === '0';
    const retryHeader = response.headers.get('retry-after');
    const limited = response.status === 429 || exhausted || retryHeader !== null || /rate limit|secondary rate|abuse detection/i.test(message);
    if (!limited) throw new GitHubError('GitHub denied access to this repository. Check that it is public; the site administrator may need to check the GitHub token permissions.');
    const retry = retryHeader === null ? 0 : (/^\d+(\.\d+)?$/.test(retryHeader) ? Number(retryHeader) * 1000 : Date.parse(retryHeader) - Date.now());
    // A non-exhausted primary allowance does not constrain secondary-limit retries.
    const reset = exhausted ? Number(response.headers.get('x-ratelimit-reset')) * 1000 - Date.now() : 0;
    const delay = Math.max(60000, Number.isFinite(retry) ? retry : 0, Number.isFinite(reset) ? reset : 0);
    const minutes = Math.ceil(delay / 60000);
    throw new GitHubError(`GitHub has temporarily paused repository checks. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}. Your project has not been submitted.`, delay);
  }
  if (response.status === 401) throw new GitHubError('The site’s GitHub connection needs attention. Ask the site administrator to replace the expired or invalid GitHub token.');
  if (response.status === 404 || response.status === 451) throw new GitHubError('Repository is unavailable or no longer public.', 0, true);
  if (!response.ok) throw new GitHubError('GitHub is temporarily unavailable.', 60000);
  const repo = await response.json();
  if (repo.private) throw new GitHubError('Only public GitHub repositories can be showcased on Nebula.', 0, true);
  if (!isPermittedLicense(repo.license?.spdx_id)) throw new GitHubError(licensePolicyMessage, 0, true);
  if (!Number.isInteger(repo.id) || typeof repo.full_name !== 'string' || typeof repo.stargazers_count !== 'number') throw new Error('Unexpected GitHub response.');
  return { githubId: repo.id as number, fullName: repo.full_name as string, stars: repo.stargazers_count as number, forks: repo.forks_count as number, language: (repo.language || 'Other') as string, license: repo.license.spdx_id as string, archived: Boolean(repo.archived), pushedAt: (repo.pushed_at || '') as string, etag: response.headers.get('etag') || '' };
}
export const submit = action({ args: { repository: v.string(), ...details.fields }, returns: v.id('projects'), handler: async (ctx, {repository, ...info}): Promise<Id<'projects'>> => {
  const ownerId = await getAuthUserId(ctx); if (!ownerId) throw new ConvexError('Sign in to submit a project.');
  try { validateDetails(info.category, info.description); const data = await fetchRepository(parseRepository(repository)); if (!data) throw new Error('Could not read repository.'); return await ctx.runMutation(internal.projects.insert, {ownerId, data, info}); }
  catch (error) {
    if (error instanceof GitHubError && error.retryMs > 0) throw new ConvexError({message: error.message, retryAt: Date.now() + error.retryMs});
    throw new ConvexError(error instanceof Error ? error.message : 'Unable to add repository.');
  }
} });
// Operational check only: never returns the token or sends it to the client.
export const connectionStatus = internalAction({ args: {}, returns: v.object({ authenticated: v.boolean(), status: v.number(), limit: v.number(), remaining: v.number(), resetAt: v.number() }), handler: async () => {
  const headers: Record<string, string> = {Accept: 'application/vnd.github+json', 'User-Agent': 'Nebula-Open-Source-Directory'};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch('https://api.github.com/rate_limit', {headers, signal: AbortSignal.timeout(15000)});
  const body = await response.json();
  return {authenticated: Boolean(process.env.GITHUB_TOKEN), status: response.status, limit: Number(body.resources?.core?.limit ?? 0), remaining: Number(body.resources?.core?.remaining ?? 0), resetAt: Number(body.resources?.core?.reset ?? 0) * 1000};
} });
export const refresh = internalAction({ args: { before: v.optional(v.number()), attempt: v.optional(v.number()) }, returns: v.null(), handler: async (ctx, args) => {
  const before = args.before ?? Date.now();
  const project = await ctx.runQuery(internal.projects.nextDue, {before}); if (!project) return null;
  let delay = process.env.GITHUB_TOKEN ? 1500 : 65000;
  try {
    // A cached response cannot revalidate a licence removed from our permitted set.
    const data = await fetchRepository(project.fullName, project.visible && isPermittedLicense(project.license) ? project.etag : undefined);
    if (data && data.githubId !== project.githubId) throw new GitHubError('The repository at this URL has changed identity. Please submit its new canonical URL.', 0, true);
    await ctx.runMutation(internal.projects.refreshed, {id: project._id, ...(data ? {data, visible: true} : {})});
  } catch (error) {
    const retry = error instanceof GitHubError ? error.retryMs : 60000;
    if (retry && (args.attempt ?? 0) < 4) { await ctx.scheduler.runAfter(Math.max(retry, 60000 * 2 ** (args.attempt ?? 0)), internal.github.refresh, {before, attempt: (args.attempt ?? 0) + 1}); return null; }
    await ctx.runMutation(internal.projects.refreshed, {id: project._id, error: error instanceof Error ? error.message : 'Refresh failed', ...(error instanceof GitHubError && error.unavailable ? {visible: false} : {})});
    if (retry) delay = Math.max(delay, retry);
  }
  await ctx.scheduler.runAfter(delay, internal.github.refresh, {before}); return null;
} });
