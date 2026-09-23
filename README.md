# Nebula

A public GitHub repository showcase built with Vite, React, TypeScript, Tailwind, Lucide, Convex, and Convex Auth.

## Development

```sh
pnpm install
pnpm exec convex dev
pnpm dev
```

The existing development backend is `fearless-crow-586`. The frontend runs at http://localhost:5173. Registration and sign-in have been verified against that backend. No production deployment was performed.

On a new deployment, configure `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` using `node scripts/setup-auth.mjs https://your-site.example`. This script generates signing material without printing it. Run it only for initial configuration or intentional key rotation: rotation invalidates existing sessions. The development deployment is already configured.

## Features

- Public directory with paginated browsing, category filters, full-text search, contribution/maintenance filters, and newest/star sorting. Text searches use relevance ordering.
- Email/password registration and sign-in through `@convex-dev/auth` (minimum 12-character passwords).
- Authenticated submissions of any eligible public GitHub repository. Submitting a listing does not assert repository ownership or affiliation.
- Server-side URL, license, category, description, duplicate-repository and ownership checks.
- Personal listing management, including edit and remove. Maximum 100 listings per account.
- Daily GitHub metadata refresh at **03:17 UTC** with serial scheduled requests, ETags, conditional requests, bounded retries and rate-limit backoff.
- User-authored descriptions and flags are preserved. GitHub archive state is displayed separately. Private, missing or ineligible repositories are hidden; submitters can see refresh errors.
- The directory starts empty. No invented projects or fabricated GitHub statistics are displayed.

## License policy

Accepted SPDX identifiers: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, Unlicense, CC0-1.0. This is a permissive-license product allowlist, not legal equivalence. Unknown/custom licenses and copyleft licenses are rejected. GitHub license detection may be incomplete; a repository must have a license recognized by the API.

## GitHub API research

GitHub provides `GET /repos/{owner}/{repo}` for repository metadata, including license identification, stars, forks, language, archival status and push dates. Daily polling fits the documented API usage model, subject to GitHub's terms and limits; it is not a special exemption or blanket approval from GitHub.

- Repository endpoint: https://docs.github.com/en/rest/repos/repos#get-a-repository
- API terms: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#h-api-terms
- Best practices: https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api
- Rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

Unauthenticated requests generally allow 60 requests/hour per source IP; token-authenticated requests generally allow 5,000/hour. Set a dedicated read-only `GITHUB_TOKEN` **on the Convex deployment**, never as a `VITE_` variable. Public-repository access is sufficient. Without a token, refreshes are spaced 65 seconds apart and share the unauthenticated allowance with submissions and potentially other traffic. A token is strongly recommended before launch and required for larger daily catalogs. Successful authenticated conditional responses can avoid primary quota charges. Retry-After and reset headers are respected; transient failures back off.

## Authentication and passkeys

The installed Convex Auth 0.0.95 package has no built-in passkey provider. Its official documentation lists passwords, OAuth, magic links and OTPs: https://labs.convex.dev/auth . Email/password is implemented; **passkeys are not enabled**. Enabling them requires changing auth integration (for example, to a supported Better Auth passkey integration) or a separately reviewed custom WebAuthn implementation.

Email verification and password recovery are not yet configured. Before public launch, add an email provider (Resend is the project default), verification/reset flows, and account-abuse controls. No email provider credentials were available in this workspace.

## Vercel

`vercel.json` selects `pnpm run build:vercel`, which runs Convex deployment, then builds the frontend with the correct `VITE_CONVEX_URL` injected.

1. Create a **Convex production deploy key** and add it to Vercel as `CONVEX_DEPLOY_KEY` (scope production and preview credentials appropriately).
2. Configure production auth signing keys and `SITE_URL` on the target Convex deployment.
3. Add the server-side GitHub token to that Convex deployment.
4. Use the provided Vercel build command. The output directory is `dist`.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Tests cover authentication/ownership boundaries, duplicate submissions, URL validation, license rejection, refresh data preservation, hidden listings, ETags and rate-limit responses. `node scripts/smoke.mjs` exercises actual registration, GitHub submission, metadata persistence, editing, sign-out/sign-in and listing removal on the named development deployment. It leaves a disposable test account but removes its test listing; passwords and session tokens are never printed or persisted.

Browser visual verification was unavailable because no browser was connected to the computer-use tool.

The implementation plan is in `docs/plans/repository-showcase.html`.
