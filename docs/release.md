# Release Engineering

dev.js uses manual release engineering for the InnovateX lab repo.

## Local Validation

Before sharing, tagging, or publishing, run:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm bench
```

## Snapshot Flow

1. Run local validation.
2. Update `RELEASE_NOTES.md` if behavior changed.
3. Create a git commit with a clear message.
4. Push manually when the maintainer is ready.

## npm Publishing

Public packages:

- `@devjs/ui`
- `@devjs/deploy`
- `@devjs/cli`
- `@devjs/build`
- `@devjs/server`
- `@devjs/router`
- `@devjs/project`
- `@devjs/core`
- `@devjs/runtime`
- `@devjs/config`
- `@devjs/plugin`

Publishing steps:

1. Ensure you are logged in to npm (`npm whoami`).
2. Run `pnpm build` at the repo root.
3. Run `pnpm publish:packages` to publish all public workspace packages.
4. Tag the release in git when appropriate.

Packages use `publishConfig.access: public` and `prepublishOnly` build hooks where needed.

## Versioning

The project is `0.1.0` for public packages and still experimental. APIs may change between minor releases until the framework stabilizes.
