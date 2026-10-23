# Nebula

A public GitHub repository showcase built with Vite, React, TypeScript, Tailwind, Lucide, Convex, and Convex Auth.

## Development

```sh
pnpm install
pnpm exec convex dev
pnpm dev
```

The frontend runs at http://localhost:5173. The historical development backend is `fearless-crow-586`, but current testing and deployment target **production only**, `careful-wombat-946` at https://www.foss.codes. Do not use the development commands above for the current production workflow; unit tests run in memory without a cloud deployment.

On a new deployment, configure `JWT_PRIVATE_KEY`, `JWKS`, and `SITE_URL` using `node scripts/setup-auth.mjs https://your-site.example`. This script generates signing material without printing it. Run it only for initial configuration or intentional key rotation: rotation invalidates existing sessions. The development deployment is already configured.

## Features

- Public directory with paginated browsing, category filters, full-text search, contribution/maintenance filters, and newest/star sorting. Text searches use relevance ordering.
- Public GET JSON API, agent instructions, OpenAPI schema, and shareable browser search/filter URLs (see Agent discovery below).
- Google account registration and sign-in through `@convex-dev/auth` (requires Google OAuth configuration below).
- Email/password registration and sign-in (minimum 12-character passwords).
- Authenticated submissions of any eligible public GitHub repository. Submitting a listing does not assert repository ownership or affiliation.
- Server-side URL, license, category, description, duplicate-repository and ownership checks.
- Personal listing management, including edit and remove. Maximum 100 listings per account.
- Daily GitHub metadata refresh at **03:17 UTC** with serial scheduled requests, ETags, conditional requests, bounded retries and rate-limit backoff.
- User-authored descriptions and flags are preserved. GitHub archive state is displayed separately. Private, missing or ineligible repositories are hidden; submitters can see refresh errors.
- The directory starts empty. No invented projects or fabricated GitHub statistics are displayed.

## Agent discovery

Production is served at **https://www.foss.codes**, backed by **careful-wombat-946**. Current testing and deployments use production only; the historical development setup above is not the deployment target.

- `/api/v1/projects`: public, read-only GET JSON search. No authentication or JavaScript required.
- `/llms.txt`: plain-text agent instructions, examples, filter values and interpretation guidance.
- `/openapi.json`: OpenAPI 3.1 schema.
- `/agents`: linked guide for agent users; also discoverable from the search area and footer.

Example: `https://www.foss.codes/api/v1/projects?q=tool&contributions=true&limit=10`.

Optional parameters: `q` (up to 200 characters), `category` (exact directory category), `contributions` and `maintained` (`true`/`false`), `sort` (`stars`/`newest`), `limit` (1–50, default 20), `cursor`. Text searches use relevance order. Other parameters and invalid values return JSON 400 errors. Search is for repository names and descriptions in submitted Nebula listings, not all of GitHub or semantic prompt matching.

Responses whitelist public project details and omit user IDs, email, internal IDs, ETags and refresh diagnostics. Visibility and the existing licence allowlist are enforced by the same query used by the website. Follow `pagination.next` while `hasMore` is true, including after empty partial pages. Do not change filters between pages. HTTP requests limit pagination scans to 500 rows / 2 MB; search failures return JSON 503. This API does not call GitHub or consume its token quota.

Browser searches use the same `q`, `category`, `contributions`, `maintained` and `sort` parameters, such as `https://www.foss.codes/?q=tool&contributions=true#explore`. Filters survive reloads and history navigation; text search explicitly shows relevance ordering. Search typing replaces the current history entry; filter changes create entries. Unknown browser category/sort values fall back to defaults.

Vercel proxies `/api/v1/*` to the production Convex HTTP Actions domain **before** the SPA fallback. Keep this destination aligned with the production deployment when changing environments. `build:vercel` continues deploying Convex before building the frontend; maintain the production `CONVEX_DEPLOY_KEY` in Vercel. Local unit tests use `convex-test`, without contacting a cloud backend.

## License policy

Nebula only showcases projects with one of these GitHub-detected SPDX identifiers: MIT, Unlicense, CC0-1.0, 0BSD, MIT-0, WTFPL, ISC, BSD-2-Clause, BSD-3-Clause, Zlib, BSL-1.0. **MIT is recommended.** Apache-2.0 is outside the permitted set. Missing, unknown, custom, and unsupported licences are rejected with an explanation and an MIT recommendation.

The public `/licences` page explains the policy, every permitted licence, and how repository checks work. It is linked from navigation, the footer, and submission guidance. React Router handles the page and browser history; Vercel rewrites direct page requests to the app entry point.

The same shared allowlist is enforced on submission and insertion, when refreshing metadata, and before paginating public browsing/search results. Legacy unsupported listings are excluded immediately and remain visible to their submitter with the rejection reason. Refreshes bypass old ETags for unsupported licences, so a `304 Not Modified` response cannot preserve eligibility under an outdated policy. Daily checks can restore a listing once a permitted licence is detected.

This is Nebula's editorial allowlist, not a claim that these licences have identical legal terms. GitHub licence detection may be incomplete; a repository must have a licence recognised by the API. Only the repository's detected licence is checked, not dependency licences. References: [GitHub licence detection](https://docs.github.com/en/rest/licenses/licenses#about-licenses), [SPDX licence list](https://spdx.org/licenses/).

## GitHub API research

GitHub provides `GET /repos/{owner}/{repo}` for repository metadata, including license identification, stars, forks, language, archival status and push dates. Daily polling fits the documented API usage model, subject to GitHub's terms and limits; it is not a special exemption or blanket approval from GitHub.

- Repository endpoint: https://docs.github.com/en/rest/repos/repos#get-a-repository
- API terms: https://docs.github.com/en/site-policy/github-terms/github-terms-of-service#h-api-terms
- Best practices: https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api
- Rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api

Unauthenticated requests generally allow 60 requests/hour per source IP; token-authenticated requests generally allow 5,000/hour. Set a dedicated read-only `GITHUB_TOKEN` **on the Convex deployment**, never as a `VITE_` variable. Public-repository access is sufficient. Without a token, refreshes are spaced 65 seconds apart and share the unauthenticated allowance with submissions and potentially other traffic. A token is strongly recommended before launch and required for larger daily catalogs. Successful authenticated conditional responses can avoid primary quota charges. Retry-After and reset headers are respected; transient failures back off.

## Google sign-in

Both account creation and sign-in offer **Continue with Google**. Convex Auth creates a user on the first successful Google sign-in and restores that account on subsequent sign-ins. Existing email/password accounts continue to work. Accounts are not merged merely because they share an unverified email address; Convex Auth only automatically links matching verified email identities.

Configure a Google OAuth client before using this option:

1. In the [Google Auth Platform](https://console.cloud.google.com/auth/overview), select a project and configure the app branding and audience. Choose **External** for a public app; add test users while the app is in testing mode.
2. Create an OAuth client of type **Web application**. Add `http://localhost:5173` as an authorized JavaScript origin for local development.
3. Add this exact authorized redirect URI for the existing development backend: `https://fearless-crow-586.convex.site/api/auth/callback/google`. For another deployment, use its HTTP Actions URL (`https://<deployment>.convex.site`) followed by `/api/auth/callback/google`.
4. In that deployment's **Convex dashboard → Settings → Environment Variables**, set `AUTH_GOOGLE_ID` to the client ID and `AUTH_GOOGLE_SECRET` to the client secret. Keep both on the backend; never put the secret in a `VITE_` variable or commit it. Set `SITE_URL` to the frontend URL (`http://localhost:5173` in development).
5. Deploy the updated backend, open Nebula, and select **Continue with Google**. Verify a new Google user can register, sign out, and sign back into the same account and its projects.

For production, configure the production callback URI and Google credentials on the production Convex deployment, and set its `SITE_URL` to the production frontend URL. Configure the Google audience for public access when ready to launch. Do not regenerate the existing auth signing keys to add Google.

Reference: [Convex Auth Google setup](https://labs.convex.dev/auth/config/oauth/google).

## Privacy policy

The public `/privacy` page describes account and Google sign-in data, public listing fields, local storage and sign-in cookies, service providers, retention, and privacy requests. It is linked from every site footer and from registration/sign-in before users submit information. The operator is **nebula.foss**, United Kingdom; privacy and account-deletion requests go to **charlie@hallville.net**.

For Google OAuth branding, set the privacy policy URL to `https://<your-production-domain>/privacy` after the frontend is deployed. It must be publicly accessible on the same domain as the app homepage and match the link on the site. See [Google OAuth app branding requirements](https://support.google.com/cloud/answer/15549049).

The policy follows the current implementation: listings can be removed in My projects, while account deletion is handled by contacting the operator. It does not promise automatic inactive-account deletion, a fixed backup purge deadline, or permissions beyond basic Google identity scopes. Update the policy date and wording when the actual data practices change.

## Terms of Service

The public `/terms` page covers account responsibilities, project eligibility, the shared permitted licence set, rights in submitted content, acceptable use, moderation, external projects, service availability, account closure, and statutory rights. It is linked from every footer and from the visible terms/privacy notice before account creation or sign-in. Both legal pages use the operator details in `src/siteOperator.ts`.

For Google OAuth branding, set the Terms of Service URL to `https://<your-production-domain>/terms` after the frontend is deployed. The privacy policy URL remains `https://<your-production-domain>/privacy`. The account notice does not record a versioned acceptance event; no backend consent-recording flow was added.

## Authentication and passkeys

The installed Convex Auth 0.0.95 package has no built-in passkey provider. Its official documentation lists passwords, OAuth, magic links and OTPs: https://labs.convex.dev/auth . Email/password is implemented; **passkeys are not enabled**. Enabling them requires changing auth integration (for example, to a supported Better Auth passkey integration) or a separately reviewed custom WebAuthn implementation.

Email verification and password recovery are not yet configured. Before public launch, add an email provider (Resend is the project default), verification/reset flows, and account-abuse controls. No email provider credentials were available in this workspace.

## Vercel

`vercel.json` selects `pnpm run build:vercel`, which runs Convex deployment, then builds the frontend with the correct `VITE_CONVEX_URL` injected.

1. Create a **Convex production deploy key** and add it to Vercel as `CONVEX_DEPLOY_KEY` (scope production and preview credentials appropriately).
2. Configure production auth signing keys, `SITE_URL`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` on the target Convex deployment, and register its Google callback URI as described above.
3. Add the server-side GitHub token to that Convex deployment.
4. Use the provided Vercel build command. The output directory is `dist`.

## Verification

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Tests cover authentication/ownership boundaries, duplicate submissions, URL validation, every permitted licence, unsupported/missing licence rejection, legacy listing visibility, refresh data preservation, hidden listings, ETags and rate-limit responses. `node scripts/smoke.mjs` exercises actual registration, unsupported-licence rejection with an MIT recommendation, permitted GitHub submission, metadata persistence, editing, sign-out/sign-in and listing removal on the named development deployment. It leaves a disposable test account but removes its test listing; passwords and session tokens are never printed or persisted.

Google sign-in changes were pushed to the existing development deployment. Live checks verified password registration, authenticated sessions, sign-out/sign-in, and Google OAuth redirect/verifier issuance. Browser DOM checks verified the Google button in both account creation and sign-in. A full Google consent/callback round trip remains unverified until `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are configured.

Implementation plans are in `docs/plans/repository-showcase.html`, `docs/plans/google-sign-in.html`, `docs/plans/permissive-licences.html`, `docs/plans/privacy-policy.html`, and `docs/plans/terms-of-service.html`.
