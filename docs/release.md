# Release Engineering

dev.js does not currently have automated release engineering. This document records the manual local process for the InnovateX lab repo.

## Local Validation

Before sharing or tagging a snapshot, run:

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

## Versioning

The project is `0.0.0` and experimental. Public APIs are not stable yet.
