# Lightfast website

This repository owns the public Lightfast website deployed at [lightfast.ai](https://lightfast.ai). The Next.js application lives in `apps/www`; its complete repository-local UI implementation lives in `packages/ui-v2`.

## Development

Requires Node.js 22.13 or newer and pnpm 11.1.3.

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

The workspace is self-contained. All `@repo/*` and `@vendor/*` imports resolve to packages in this repository; it has no filesystem or workspace dependency on `lightfastai/lightfast`.

## History provenance

The initial history was extracted from `lightfastai/lightfast` at source commit `5e1ff6b0d798b31d95d35ca69ca5240400a2074f` with `git-filter-repo`, retaining only `apps/www/` and `packages/ui-v2/`. That source commit maps to filtered commit `4cbeb3539f4f7e12a521d58e973e31644ecd09e9`. The one-time extraction tooling was removed after the standalone repository was verified.

The copied `packages/ui-v2` implementation intentionally also remains in `lightfastai/lightfast` for its existing consumers. No shared UI package is published by this repository.
