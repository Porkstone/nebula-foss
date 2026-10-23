import { categories } from '../convex/lib/policy';

export function readSearchFilters(params: URLSearchParams) {
  const category = params.get('category') ?? '';
  return {
    search: (params.get('q') ?? '').slice(0, 200),
    category: (categories as readonly string[]).includes(category) ? category : '',
    sort: params.get('sort') === 'newest' ? 'newest' : 'stars',
    contributions: params.get('contributions') === 'true',
    maintained: params.get('maintained') === 'true',
  };
}

export function changeSearchFilter(params: URLSearchParams, name: string, value: string | boolean) {
  const next = new URLSearchParams(params);
  if (value === '' || value === false || (name === 'sort' && value === 'stars')) next.delete(name);
  else next.set(name, String(value));
  return next;
}
