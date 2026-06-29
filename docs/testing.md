# Testing Strategy

## Test Layers

- Unit tests validate package-local behavior.
- Integration tests validate package composition.
- E2E tests validate user-visible workflows.
- Benchmarks track performance-sensitive primitives.
- Cross-platform CI validates Linux, macOS, and Windows behavior.

## Required Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm bench
pnpm build
```

## Coverage Expectations

Public APIs require behavior tests. Bug fixes should include a regression test. Performance-sensitive APIs should include a benchmark before optimization work begins.
