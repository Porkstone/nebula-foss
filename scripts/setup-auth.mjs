import { generateKeyPair, exportPKCS8, exportJWK } from 'jose';
import { execFileSync } from 'node:child_process';
// Uses the selected development deployment. Never prints signing material.
const keys = await generateKeyPair('RS256', { extractable: true });
const values = {
  JWT_PRIVATE_KEY: (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, ' '),
  JWKS: JSON.stringify({keys: [{use: 'sig', ...await exportJWK(keys.publicKey)}]}),
  SITE_URL: process.argv[2] || 'http://localhost:5173',
};
for (const [name, value] of Object.entries(values)) {
  execFileSync(process.execPath, ['node_modules/convex/bin/main.js', 'env', 'set', `${name}=${value}`], {stdio: 'pipe'});
  console.log(`Configured ${name}`);
}
