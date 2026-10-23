import { v } from 'convex/values';
import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { query, mutation, internalMutation, internalQuery } from './_generated/server';
import schema, { details, metadata } from './schema';
import { isPermittedLicense, licensePolicyMessage, licenses, validateDetails, validateLicense } from './lib/policy';
export const list = query({ args: { paginationOpts: paginationOptsValidator, search: v.string(), category: v.string(), contributions: v.boolean(), maintained: v.boolean(), sort: v.string() }, returns: paginationResultValidator(schema.doc('projects')), handler: async (ctx, args) => {
  if (args.search.trim()) return await ctx.db.query('projects').withSearchIndex('search_projects', q => {
    let s = q.search('searchText', args.search.trim()).eq('visible', true);
    if (args.category) s = s.eq('category', args.category);
    if (args.contributions) s = s.eq('contributions', true);
    if (args.maintained) s = s.eq('maintained', true);
    return s;
  }).filter(q => q.or(...licenses.map(license => q.eq(q.field('license'), license)))).paginate(args.paginationOpts);
  const base = args.category
    ? args.sort === 'stars'
      ? ctx.db.query('projects').withIndex('by_visible_and_category_and_stars', q => q.eq('visible', true).eq('category', args.category))
      : ctx.db.query('projects').withIndex('by_visible_and_category', q => q.eq('visible', true).eq('category', args.category))
    : args.sort === 'stars' ? ctx.db.query('projects').withIndex('by_visible_and_stars', q => q.eq('visible', true)) : ctx.db.query('projects').withIndex('by_visible', q => q.eq('visible', true));
  return await base.order('desc').filter(q => q.and(q.or(...licenses.map(license => q.eq(q.field('license'), license))), ...[...(args.category ? [q.eq(q.field('category'), args.category)] : []), ...(args.contributions ? [q.eq(q.field('contributions'), true)] : []), ...(args.maintained ? [q.eq(q.field('maintained'), true)] : [])])).paginate(args.paginationOpts);
} });
export const mine = query({ args: {}, returns: v.array(schema.doc('projects')), handler: async ctx => {
  const user = await getAuthUserId(ctx);
  if (!user) return [];
  const projects = await ctx.db.query('projects').withIndex('by_ownerId', q => q.eq('ownerId', user)).order('desc').take(100);
  // Explain why legacy listings are excluded, even before their next daily refresh.
  return projects.map(project => isPermittedLicense(project.license) ? project : {...project, visible: false, refreshError: licensePolicyMessage});
} });
export const insert = internalMutation({ args: { ownerId: v.id('users'), data: metadata, info: details }, returns: v.id('projects'), handler: async (ctx, {ownerId, data, info}) => {
  validateDetails(info.category, info.description);
  validateLicense(data.license);
  if (await ctx.db.query('projects').withIndex('by_githubId', q => q.eq('githubId', data.githubId)).unique()) throw new Error('This repository is already listed.');
  if ((await ctx.db.query('projects').withIndex('by_ownerId', q => q.eq('ownerId', ownerId)).take(100)).length >= 100) throw new Error('You can showcase up to 100 projects.');
  return await ctx.db.insert('projects', {...data, ...info, ownerId, visible: true, lastChecked: Date.now(), searchText: `${data.fullName} ${info.description}`});
} });
export const edit = mutation({ args: { id: v.id('projects'), ...details.fields }, returns: v.null(), handler: async (ctx, {id, ...info}) => {
  const user = await getAuthUserId(ctx); const project = await ctx.db.get('projects', id);
  if (!user || !project || project.ownerId !== user) throw new Error('You can only edit your own listings.');
  validateDetails(info.category, info.description);
  await ctx.db.patch('projects', id, {...info, searchText: `${project.fullName} ${info.description}`}); return null;
} });
export const remove = mutation({ args: { id: v.id('projects') }, returns: v.null(), handler: async (ctx, {id}) => {
  const user = await getAuthUserId(ctx); const project = await ctx.db.get('projects', id);
  if (!user || !project || project.ownerId !== user) throw new Error('You can only remove your own listings.');
  await ctx.db.delete('projects', id); return null;
} });
export const nextDue = internalQuery({ args: { before: v.number() }, returns: v.union(schema.doc('projects'), v.null()), handler: async (ctx, {before}) => await ctx.db.query('projects').withIndex('by_lastChecked', q => q.lt('lastChecked', before)).first() });
export const refreshed = internalMutation({ args: { id: v.id('projects'), data: v.optional(metadata), visible: v.optional(v.boolean()), error: v.optional(v.string()) }, returns: v.null(), handler: async (ctx, args) => {
  const project = await ctx.db.get('projects', args.id); if (!project) return null;
  const permitted = isPermittedLicense(args.data?.license ?? project.license);
  await ctx.db.patch('projects', args.id, { ...args.data, ...(args.visible === undefined ? {} : {visible: args.visible}), ...(!permitted ? {visible: false} : {}), lastChecked: Date.now(), refreshError: permitted ? args.error : licensePolicyMessage, ...(args.data ? {searchText: `${args.data.fullName} ${project.description}`} : {}) }); return null;
} });
