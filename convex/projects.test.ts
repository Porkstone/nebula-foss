/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, expect, test, vi } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
import { fetchRepository } from './github';
import { parseRepository } from './lib/policy';
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
test('GitHub validation rejects private, unknown and copyleft licenses', async () => {
  for (const repo of [{private: true, license: {spdx_id: 'MIT'}}, {private: false, license: null}, {private: false, license: {spdx_id: 'GPL-3.0'}}]) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(repo)));
    await expect(fetchRepository('a/b')).rejects.toThrow('permissive license');
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
