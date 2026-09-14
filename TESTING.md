# Website verification

Run from the repository root with Node.js 22.13+ and pnpm 11.1.3:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @lightfast/www exec playwright install chromium
pnpm test:e2e
pnpm boundaries
pnpm audit:prod
```

The required `pull-request-validation` job runs the same commands (installing
Chromium's OS dependencies on Linux). `pnpm verify` runs the checks after dependency
and browser installation. Playwright starts the built site on 127.0.0.1:4187 and
refuses to reuse an existing server. It stops its own server after the suite.

## Discovery and isolation

Vitest discovers `src/**/*.{test,spec}.{ts,tsx}` in `apps/www`, including colocated
and nested tests. An empty selection fails. React component tests opt into jsdom;
route, metadata, dependency and service tests use Node. Shared configuration bounds
worker count to two and runs files serially. Playwright separately discovers
`apps/www/e2e/*.spec.ts`; both runners are in the normal PR gate.

Tests are deliberately uncached in Turbo: repository ownership and dependency
checks inspect tracked files outside the app package. A prior app-only cache key
could reuse a stale pass after those files changed. Ownership scans use Git's
tracked-file inventory and never recurse into ignored or untracked local artifacts.

Newsletter component tests replace the server action before loading either form.
Action tests replace Resend, Slack, protection, instrumentation and Next request
context with local mocks. Browser tests intercept POSTs and external requests;
newsletter results are local React action responses. No newsletter test sends an
email or uses a production service. Test identities use the reserved `.test` TLD.
Fixtures live next to the tests; none requires a service account or credential.

## Coverage audit

| Existing surface | Protection retained or replacement |
| --- | --- |
| `halftone-contract.test.ts` | Replaced by TSX lifecycle tests: unsupported and initialization/error fallback, bounded elapsed time, field dimensions, palette and render parameters, two-pass rendering, offscreen pause and resource cleanup. Three narrow shader math assertions remain because the GPU is mocked. |
| `marketing-chrome.test.ts` | Navigation functions, public brand metadata, thesis and usage terms retained. Source spelling/class ordering checks replaced by newsletter DOM interactions and built-site layout, reduced-motion, mobile overflow and navigation checks. The date lock and duplicated founder assertion were removed; founder coverage remains in public identity tests. |
| `public-contract.test.ts` | Redirects, gone responses, health rewrite, CSP, content route/indexing intent and root metadata retained. Generated MCP/robots/sitemap/LLM output is checked through actual return values or local HTTP instead of source expressions. |
| `public-identity.test.ts` | Retained: founder entity/domain, approved prose, homepage thesis, and local Tailwind source wiring. These are intentional public-content and repository-structure contracts. |
| `sentry-env.test.ts` | Retained optional-token normalization and environment restoration. |
| `standalone-ownership.test.ts` | Local-only MCP documentation, links, dev ownership, retired wiring absence and specific retired dependency checks retained. Scan restricted to tracked files. Removed duplicated metadata source expressions and an unrelated blanket ban on any future lockfile patch. |
| `workspace-policy.test.ts` | Retained workspace protocol, shared catalog, and filesystem dependency guards using the actual pnpm workspace inventory. |
| New action and discovery tests | Add provider-isolated validation, normalization, conflicts, protection denial and recoverable errors, plus production/preview robots behavior. |
| New asset and browser tests | Verify all asset hashes, PNG dimensions, file-based metadata ownership, served bytes, manifest URLs, startup icon, organization logo, accessibility states and mobile/desktop recovery. |

The audit also covered all workspace package scripts, Turbo inputs, the shared
Vitest configuration, app configuration, formatter exclusions and the sole native
validation workflow. Obsolete formatter exclusions for removed applications and
packages were removed. Canonical generated SVGs have a formatting-only exception:
changing whitespace would invalidate their source hashes. Lint and hash checks
still run. Existing UI component exclusions remain intact.

Mocked GPU tests do not establish visual GPU output parity. They retain shader math
contracts and exercise the component's lifecycle; the website artwork and shaders
are unchanged. Browser checks establish local built-site behavior, not publication
or delivery through external providers.

## Brand assets

`apps/www/brand-assets.json` records canonical Lightfast source provenance and
SHA-256 for each individual file. The three App Router files are `favicon.ico`,
`icon.svg` and `apple-icon.png`. Other icon sizes, the white icon, and the black and
white complete logos live in `apps/www/public`, outside metadata discovery.

The old public icon files were replaced and all in-repository consumers updated.
The existing brand guideline construction images remain: the page actually uses
them, and they are explanatory artwork rather than duplicate icon downloads.
No historical artwork or unrelated public media was removed.

File-based icon conventions are documented in the
[Next.js metadata reference](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons).
A successful PR/preview does not authorize the merge that publishes this website.
