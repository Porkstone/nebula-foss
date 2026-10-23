/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { expect, test } from 'vitest';
import schema from './schema';
import type { Doc } from './_generated/dataModel';

const modules = import.meta.glob('./**/*.ts');
const project = {githubId: 1, fullName: 'example/compiler', description: 'A compiler for building useful developer tools.', category: 'Developer tools', stars: 12, forks: 2, language: 'TypeScript', license: 'MIT', archived: false, pushedAt: '2026-10-01T00:00:00Z', etag: 'private-etag', contributions: true, maintained: true, visible: true, lastChecked: 123, searchText: 'example/compiler A compiler for building useful developer tools.'};

async function fixture() {
  const t = convexTest(schema, modules);
  await t.run(async ctx => {
    const ownerId = await ctx.db.insert('users', {email: 'private@example.test'});
    const add = (extra: Partial<Doc<'projects'>>) => ctx.db.insert('projects', {...project, ownerId, ...extra});
    await add({});
    await add({githubId: 2, fullName: 'example/editor', stars: 5, category: 'Productivity', contributions: false, searchText: 'example/editor A useful editor for documents.'});
    await add({githubId: 3, fullName: 'example/hidden', visible: false});
    await add({githubId: 4, fullName: 'example/legacy', license: 'GPL-3.0'});
    await add({githubId: 5, fullName: 'example/unlicensed', license: 'NOASSERTION'});
  });
  return t;
}

test('anonymous HTTP search exposes only public fields and enforces visibility and licence policy', async () => {
  const t = await fixture();
  const response = await t.fetch('/api/v1/projects');
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toContain('application/json');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  const result = await response.json();
  expect(result.projects.map((p: {fullName: string}) => p.fullName)).toEqual(['example/compiler', 'example/editor']);
  expect(result.projects[0]).toMatchObject({repositoryUrl: 'https://github.com/example/compiler', license: 'MIT', stars: 12, contributions: true});
  expect(Object.keys(result.projects[0]).sort()).toEqual(['fullName', 'repositoryUrl', 'description', 'category', 'language', 'license', 'stars', 'forks', 'contributions', 'maintained', 'archived', 'pushedAt', 'addedAt'].sort());
  const body = JSON.stringify(result);
  for (const privateField of ['ownerId', 'private@example.test', 'private-etag', 'refreshError', 'lastChecked', 'searchText', '_id']) expect(body).not.toContain(privateField);
  expect(result.pagination).toEqual({hasMore: false, next: null, nextCursor: null});
});

test('keyword, category and boolean filters use the same indexed directory search', async () => {
  const t = await fixture();
  const response = await t.fetch('/api/v1/projects?q=compiler&category=Developer%20tools&contributions=true&maintained=true&sort=newest');
  const result = await response.json();
  expect(response.status).toBe(200);
  expect(result.order).toBe('relevance');
  expect(result.projects.map((p: {fullName: string}) => p.fullName)).toEqual(['example/compiler']);
  const mismatch = await (await t.fetch('/api/v1/projects?q=compiler&category=Productivity')).json();
  expect(mismatch.projects).toEqual([]);
  const unfiltered = await (await t.fetch('/api/v1/projects?contributions=false&maintained=false')).json();
  expect(unfiltered.projects).toHaveLength(2);
});

test('pagination provides a complete next link retaining filters, with no duplicate or hidden results', async () => {
  const t = await fixture();
  const first = await (await t.fetch('/api/v1/projects?limit=1&sort=stars&maintained=true')).json();
  expect(first.projects).toHaveLength(1);
  expect(first.pagination.hasMore).toBe(true);
  const next = new URL(first.pagination.next);
  expect(next.origin).toBe('https://www.foss.codes');
  expect(next.pathname).toBe('/api/v1/projects');
  expect(next.searchParams.get('maintained')).toBe('true');
  expect(next.searchParams.get('limit')).toBe('1');
  expect(next.searchParams.get('cursor')).toBe(first.pagination.nextCursor);
  const second = await (await t.fetch(next.pathname + next.search)).json();
  expect(second.projects.map((p: {fullName: string}) => p.fullName)).toEqual(['example/editor']);
  expect(second.pagination).toEqual({hasMore: false, next: null, nextCursor: null});
});

test('no results is a successful empty page', async () => {
  const t = await fixture();
  const response = await t.fetch('/api/v1/projects?q=nonexistent');
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({projects: [], pagination: {hasMore: false, next: null}});
});

test.each(['limit=0', 'limit=51', 'limit=1.5', 'limit=abc', 'limit=-1', 'category=Missing', 'sort=random', 'contributions=1', 'maintained=TRUE', 'q=one&q=two', 'unknown=true', 'cursor=', `q=${'x'.repeat(201)}`, `cursor=${'x'.repeat(8193)}`])('invalid API parameters return actionable JSON: %s', async query => {
  const t = convexTest(schema, modules);
  const response = await t.fetch(`/api/v1/projects?${query}`);
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({error: {code: 'invalid_request', message: expect.any(String)}, documentation: 'https://www.foss.codes/llms.txt'});
});

test('API search does not accept writes', async () => {
  const t = convexTest(schema, modules);
  const response = await t.fetch('/api/v1/projects', {method: 'POST', body: '{}'});
  expect(response.ok).toBe(false);
  expect(await t.run(ctx => ctx.db.query('projects').take(1))).toEqual([]);
});
