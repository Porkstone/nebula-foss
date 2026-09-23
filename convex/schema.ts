import { defineSchema, defineTable } from 'convex/server';
import { authTables } from '@convex-dev/auth/server';
import { v } from 'convex/values';
export const metadata = v.object({ githubId: v.number(), fullName: v.string(), stars: v.number(), forks: v.number(), language: v.string(), license: v.string(), archived: v.boolean(), pushedAt: v.string(), etag: v.string() });
export const details = v.object({ category: v.string(), description: v.string(), contributions: v.boolean(), maintained: v.boolean() });
export default defineSchema({
  ...authTables,
  projects: defineTable({ ...metadata.fields, ...details.fields, ownerId: v.id('users'), visible: v.boolean(), lastChecked: v.number(), refreshError: v.optional(v.string()), searchText: v.string() })
    .index('by_githubId', ['githubId']).index('by_ownerId', ['ownerId'])
    .index('by_visible', ['visible']).index('by_visible_and_stars', ['visible', 'stars'])
    .index('by_visible_and_category', ['visible', 'category'])
    .index('by_visible_and_category_and_stars', ['visible', 'category', 'stars'])
    .index('by_lastChecked', ['lastChecked'])
    .searchIndex('search_projects', { searchField: 'searchText', filterFields: ['visible', 'category', 'contributions', 'maintained'] }),
});
