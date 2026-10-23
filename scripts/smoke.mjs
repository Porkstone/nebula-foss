import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
const env = readFileSync('.env.local', 'utf8');
const url = /^VITE_CONVEX_URL=(.+)$/m.exec(env)?.[1].trim();
if (!url?.includes('fearless-crow-586')) throw new Error('Smoke test is scoped to the development deployment.');
const client = new ConvexHttpClient(url);
const email = `nebula-smoke-${Date.now()}@example.test`;
const password = randomUUID();
let id;
try {
  const signup = await client.action(api.auth.signIn, {provider: 'password', params: {email, password, flow: 'signUp'}});
  if (!signup.tokens?.token) throw new Error('Registration did not return a token');
  client.setAuth(signup.tokens.token);
  console.log('PASS registration and authenticated session');
  let rejected = false;
  try {
    const unexpectedId = await client.action(api.github.submit, {repository: 'https://github.com/apache/airflow', category: 'Developer tools', description: 'A repository outside the permitted licence set for this negative smoke test.', contributions: true, maintained: true});
    await client.mutation(api.projects.remove, {id: unexpectedId});
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('We recommend the MIT licence')) throw error;
    rejected = true;
  }
  if (!rejected || (await client.query(api.projects.mine, {})).length !== 0) throw new Error('Unsupported licence was not rejected without creating a listing');
  console.log('PASS live unsupported licence rejection with MIT recommendation and no listing created');
  id = await client.action(api.github.submit, {repository: 'https://github.com/vitejs/vite', category: 'Developer tools', description: 'A fast frontend development server and build tool for modern web applications.', contributions: true, maintained: true});
  const projects = await client.query(api.projects.mine, {});
  if (!projects.some(p => p._id === id && p.license === 'MIT' && p.stars > 0)) throw new Error('Submitted project metadata was not retrieved');
  console.log('PASS live GitHub license validation, submission and persistence');
  await client.mutation(api.projects.edit, {id, category: 'Developer tools', description: 'An updated description of a fast web development tool.', contributions: false, maintained: true});
  const edited = await client.query(api.projects.mine, {});
  if (edited.find(p => p._id === id)?.contributions !== false) throw new Error('Edit did not persist');
  console.log('PASS authenticated editing');
  await client.action(api.auth.signOut, {});
  client.clearAuth();
  const signin = await client.action(api.auth.signIn, {provider: 'password', params: {email, password, flow: 'signIn'}});
  if (!signin.tokens?.token) throw new Error('Sign-in failed');
  client.setAuth(signin.tokens.token);
  console.log('PASS sign-out and sign-in');
} finally {
  if (id) {await client.mutation(api.projects.remove, {id}); console.log('PASS test listing removed');}
  await client.action(api.auth.signOut, {}).catch(() => {});
}
