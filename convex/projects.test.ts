/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
import { fetchRepository } from './github';
import { parseRepository } from './lib/policy';
import { licensePolicyMessage } from './lib/policy';
const modules = import.meta.glob('./**/*.ts');
const data = { githubId: 123, fullName: 'owner/project', stars: 10, forks: 2, language: 'TypeScript', license: 'MIT', archived: false, pushedAt: '2026-01-01T00:00:00Z', etag: 'etag' };
const info = {category: 'Developer tools', description: 'A useful tool for building great applications.', contributions: true, maintained: true};
afterEach(() => vi.restoreAllMocks());
test('repository URLs cannot escape the GitHub repository endpoint', () => {
  expect(parseRepository('https://github.com/owner/repo.git')).toBe('owner/repo');
  for (const url of ['https://evil.com/owner/repo', 'https://github.com/a/b/issues', 'a/..', 'https://github.com/a/b?x=1']) expect(() => parseRepository(url)).toThrow();
});
test('registration required; only the submitting user can edit/remove; duplicates rejected', async () => {
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', {email: 'owner@example.test'}));
  const otherId = await t.run(ctx => ctx.db.insert('users', {email: 'other@example.test'}));
  const id = await t.mutation(internal.projects.insert, {ownerId, data, info});
  await expect(t.action(api.github.submit, {repository: 'owner/repo', ...info})).rejects.toThrow('Sign in');
  await expect(t.mutation(api.projects.edit, {id, ...info})).rejects.toThrow('own listings');
  const other = t.withIdentity({subject: `${otherId}|session`});
  await expect(other.mutation(api.projects.remove, {id})).rejects.toThrow('own listings');
  await expect(other.mutation(api.projects.edit, {id, ...info})).rejects.toThrow('own listings');
  await expect(t.mutation(internal.projects.insert, {ownerId: otherId, data, info})).rejects.toThrow('already listed');
  const owner = t.withIdentity({subject: `${ownerId}|session`});
  await owner.mutation(api.projects.edit, {id, ...info, contributions: false});
  expect((await owner.query(api.projects.mine, {}))[0].contributions).toBe(false);
  await owner.mutation(api.projects.remove, {id});
  expect(await owner.query(api.projects.mine, {})).toEqual([]);
});
test('refresh preserves authored descriptions and hides ineligible projects', async () => {
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', {}));
  const id = await t.mutation(internal.projects.insert, {ownerId, data, info});
  await t.mutation(internal.projects.refreshed, {id, data: {...data, stars: 99}});
  const project = await t.run(ctx => ctx.db.get('projects', id));
  expect(project).toMatchObject({description: info.description, stars: 99, maintained: true});
  await t.mutation(internal.projects.refreshed, {id, visible: false, error: 'License changed'});
  const result = await t.query(api.projects.list, {paginationOpts: {cursor: null, numItems: 12}, search: '', category: '', contributions: false, maintained: false, sort: 'stars'});
  expect(result.page).toEqual([]);
});
test.each(['MIT', 'Unlicense', 'CC0-1.0', '0BSD', 'MIT-0', 'WTFPL', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Zlib', 'BSL-1.0'])('accepts the permitted GitHub licence %s', async license => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({id: 123, full_name: 'owner/project', private: false, stargazers_count: 10, forks_count: 2, license: {spdx_id: license}})));
  expect(await fetchRepository('owner/project')).toMatchObject({license});
});
test.each(['Apache-2.0', 'GPL-3.0', 'AGPL-3.0-only', 'MPL-2.0', 'NOASSERTION', 'mit', 'MIT OR Apache-2.0', null])('rejects unsupported or missing licence %s with the MIT recommendation', async license => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({private: false, license: license === null ? null : {spdx_id: license}})));
  await expect(fetchRepository('owner/project')).rejects.toMatchObject({message: licensePolicyMessage, unavailable: true, retryMs: 0});
});
test('private repositories are rejected even with an MIT licence', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({private: true, license: {spdx_id: 'MIT'}})));
  await expect(fetchRepository('owner/project')).rejects.toThrow('Only public GitHub repositories');
});
test('unsupported submissions cannot create a listing through the action or internal insert', async () => {
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', {}));
  const owner = t.withIdentity({subject: `${ownerId}|session`});
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({private: false, license: {spdx_id: 'Apache-2.0'}})));
  await expect(owner.action(api.github.submit, {repository: 'owner/project', ...info})).rejects.toThrow('We recommend the MIT licence');
  await expect(t.mutation(internal.projects.insert, {ownerId, data: {...data, license: 'Apache-2.0'}, info})).rejects.toThrow('We recommend the MIT licence');
  expect(await owner.query(api.projects.mine, {})).toEqual([]);
});
test('legacy unsupported listings are excluded from every browse and search path but explained to their owner', async () => {
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', {}));
  const permittedId = await t.mutation(internal.projects.insert, {ownerId, data, info});
  const legacyId = await t.run(ctx => ctx.db.insert('projects', {...data, ...info, githubId: 999, ownerId, license: 'Apache-2.0', visible: true, lastChecked: 0, searchText: 'owner/project useful developer tool'}));
  for (const sort of ['stars', 'newest']) {
    for (const category of ['', info.category]) {
      for (const search of ['', 'useful']) {
        const result = await t.query(api.projects.list, {paginationOpts: {cursor: null, numItems: 12}, search, category, contributions: false, maintained: false, sort});
        expect(result.page.map(project => project._id)).toEqual([permittedId]);
      }
    }
  }
  const owner = t.withIdentity({subject: `${ownerId}|session`});
  expect((await owner.query(api.projects.mine, {})).find(project => project._id === legacyId)).toMatchObject({visible: false, refreshError: licensePolicyMessage});
});
test('refresh hides unsupported licences and restores eligibility after a permitted licence is detected', async () => {
  const t = convexTest(schema, modules);
  const ownerId = await t.run(ctx => ctx.db.insert('users', {}));
  const id = await t.mutation(internal.projects.insert, {ownerId, data, info});
  await t.mutation(internal.projects.refreshed, {id, data: {...data, license: 'GPL-3.0'}, visible: true});
  expect(await t.run(ctx => ctx.db.get('projects', id))).toMatchObject({visible: false, refreshError: licensePolicyMessage});
  await t.mutation(internal.projects.refreshed, {id, visible: true});
  expect(await t.run(ctx => ctx.db.get('projects', id))).toMatchObject({visible: false});
  await t.mutation(internal.projects.refreshed, {id, data: {...data, license: 'MIT-0'}, visible: true});
  expect(await t.run(ctx => ctx.db.get('projects', id))).toMatchObject({visible: true, license: 'MIT-0', description: info.description});
  expect((await t.run(ctx => ctx.db.get('projects', id)))?.refreshError).toBeUndefined();
});
test('refresh bypasses an old ETag when the stored licence is no longer permitted', async () => {
  vi.useFakeTimers();
  try {
    const t = convexTest(schema, modules);
    const ownerId = await t.run(ctx => ctx.db.insert('users', {}));
    const id = await t.run(ctx => ctx.db.insert('projects', {...data, ...info, ownerId, license: 'Apache-2.0', visible: true, lastChecked: 0, searchText: 'owner/project'}));
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({private: false, license: {spdx_id: 'Apache-2.0'}})));
    await t.action(internal.github.refresh, {before: 1});
    expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty('If-None-Match');
    expect(await t.run(ctx => ctx.db.get('projects', id))).toMatchObject({visible: false, refreshError: licensePolicyMessage});
    await t.finishAllScheduledFunctions(vi.runAllTimers);
  } finally {
    vi.useRealTimers();
  }
});
test('conditional requests handle 304 and rate limits', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 304}));
  expect(await fetchRepository('a/b', 'old-etag')).toBeNull();
  expect(fetch.mock.calls[0][1]?.headers).toMatchObject({'If-None-Match': 'old-etag'});
  fetch.mockResolvedValue(new Response(null, {status: 429, headers: {'Retry-After': '120'}}));
  await expect(fetchRepository('a/b')).rejects.toMatchObject({retryMs: 120000});
});
test('permission failures are not mislabeled as rate limits', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({message: 'Resource not accessible by personal access token'}), {status: 403, headers: {'x-ratelimit-remaining': '4999'}}));
  await expect(fetchRepository('a/b')).rejects.toMatchObject({retryMs: 0, message: expect.stringContaining('denied access')});
});
test('primary exhaustion waits for reset but secondary limits ignore unused primary reset', async () => {
  const reset = Math.ceil(Date.now() / 1000) + 3600;
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({message: 'API rate limit exceeded'}), {status: 403, headers: {'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset)}}));
  await expect(fetchRepository('a/b')).rejects.toMatchObject({retryMs: expect.any(Number), message: expect.stringContaining('temporarily paused')});
  fetch.mockResolvedValue(new Response(JSON.stringify({message: 'Secondary rate limit exceeded'}), {status: 403, headers: {'x-ratelimit-remaining': '4999', 'x-ratelimit-reset': String(reset), 'retry-after': '120'}}));
  await expect(fetchRepository('a/b')).rejects.toMatchObject({retryMs: 120000});
});
test('invalid GitHub credentials give an actionable configuration error', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {status: 401}));
  await expect(fetchRepository('a/b')).rejects.toMatchObject({retryMs: 0, message: expect.stringContaining('expired or invalid')});
});
