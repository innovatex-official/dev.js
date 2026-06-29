# Roadmap

dev.js is an InnovateX CS lab experiment. The roadmap is intentionally practical and learning-oriented.

## Done: Foundation

- Establish monorepo structure and package boundaries.
- Define config, plugin, runtime, core, project, router, server, build, and CLI contracts.
- Add tests, benchmarks, examples, and documentation.

## Done: Project System

- Load `dev.config.ts`.
- Add workspace graph discovery.
- Add project diagnostics and dependency checks.
- Define stable error codes.

## Done: Development And Build

- Add filesystem route discovery.
- Add a local development HTTP server.
- Add browser-rendered route output.
- Add static HTML production output.
- Add `devjs dev` and `devjs build`.

## Next: Better Developer Experience

- Add clearer error pages for config and route failures.
- Add `devjs init` for creating new starter projects.
- Add route params such as `/posts/[slug]`.
- Add static asset serving from `public`.
- Add a small client reload runtime.

## Later: Framework Research

- Explore a compiler or bundler integration.
- Explore HMR.
- Explore deployment output formats.
- Explore package graph dependency edges.
