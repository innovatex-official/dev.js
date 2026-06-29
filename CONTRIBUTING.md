# Contributing

Thanks for helping with dev.js, an InnovateX CS lab community experiment.

## Development Setup

```sh
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Contribution Standards

- Keep package responsibilities narrow.
- Add tests for behavior changes.
- Add benchmarks for performance-sensitive code paths.
- Update documentation when public APIs change.
- Avoid circular dependencies.
- Prefer small, focused pull requests.
- Keep the project understandable for students and community contributors.

## Local Checklist

- The change has a clear problem statement.
- Public APIs are documented.
- Tests cover the intended behavior.
- Performance impact is understood.
- Security impact is considered.
- Breaking changes are called out explicitly.

## Design Notes

Use `docs/rfcs` for major experiments or package-boundary changes. Lightweight notes are fine; this repo does not need heavyweight governance.
