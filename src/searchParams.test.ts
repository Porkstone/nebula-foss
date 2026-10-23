import { expect, test } from 'vitest';
import { changeSearchFilter, readSearchFilters } from './searchParams';

test('a shared search URL restores every filter, including an encoded ampersand', () => {
  const filters = readSearchFilters(new URLSearchParams('q=document+editor&category=Web+%26+frontend&sort=newest&contributions=true&maintained=true'));
  expect(filters).toEqual({search: 'document editor', category: 'Web & frontend', sort: 'newest', contributions: true, maintained: true});
});

test('changing a filter retains the other values and leaves the previous history state intact', () => {
  const initial = new URLSearchParams('q=compiler&sort=newest&contributions=true');
  const changed = changeSearchFilter(initial, 'category', 'AI & machine learning');
  expect(readSearchFilters(changed)).toMatchObject({search: 'compiler', sort: 'newest', contributions: true, category: 'AI & machine learning'});
  expect(initial.has('category')).toBe(false);
  expect(readSearchFilters(changeSearchFilter(changed, 'q', ''))).toMatchObject({search: '', category: 'AI & machine learning'});
  expect(changeSearchFilter(changed, 'contributions', false).has('contributions')).toBe(false);
  expect(changeSearchFilter(changed, 'sort', 'stars').has('sort')).toBe(false);
});

test('invalid browser filters fall back to usable defaults and bound search input', () => {
  expect(readSearchFilters(new URLSearchParams('category=missing&sort=missing&contributions=1'))).toEqual({search: '', category: '', sort: 'stars', contributions: false, maintained: false});
  expect(readSearchFilters(new URLSearchParams({q: 'x'.repeat(300)})).search).toHaveLength(200);
});
