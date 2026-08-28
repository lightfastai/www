# Repository instructions

Lightfast's public website is a pnpm/Turborepo workspace.

- The deployable Next.js application is `apps/www` (`@lightfast/www`).
- The complete local UI source is `packages/ui-v2` (`@repo/ui-v2`). Do not replace it with a filesystem dependency or publish it as a shared package.
- Repository-local third-party adapters live under `vendor/`; shared TypeScript and Vitest configuration lives under `internal/`.
- Use `workspace:*` for internal packages and `catalog:` for shared external versions.
- Keep the Vercel project identity `lightfast-www`, its `apps/www` root, and the `lightfast-app` microfrontend route contract intact.
- Do not redesign the public site or add indexing/reindexing behavior as part of infrastructure maintenance.

Before completing changes, run `pnpm test`, `pnpm typecheck`, and `pnpm build`.
