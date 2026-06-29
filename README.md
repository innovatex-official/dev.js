# dev.js

dev.js is an experimental TypeScript developer-platform prototype from InnovateX, a CS lab community.

Repository: https://github.com/innovatex-official/dev.js

This project was built for exploration and learning. It is not trying to replace production frameworks today, but it is structured with production-grade engineering habits: typed package boundaries, tests, benchmarks, docs, examples, and a working end-to-end app lifecycle.

## What Works

- `devjs doctor` loads a project and reports diagnostics.
- `devjs dev` starts a local HTTP development server.
- `devjs build` writes static HTML output to `dist/devjs`.
- Filesystem routes render browser pages from `app/routes`.
- The `hello-devjs` starter proves the end-to-end flow.

## Project Scope

dev.js currently supports a small but complete framework slice:

- config loading
- plugin contracts
- project diagnostics
- workspace discovery
- route discovery
- development HTTP serving
- static HTML build output
- CLI commands

It does not yet include a compiler, HMR runtime, client router, database layer, auth layer, deployment adapters, or stable public API guarantees.

## Packages

- `@devjs/plugin`: public plugin contract.
- `@devjs/config`: configuration schema and normalization.
- `@devjs/runtime`: runtime planning primitives.
- `@devjs/core`: platform kernel composition.
- `@devjs/project`: project loading, workspace discovery, and diagnostics.
- `@devjs/router`: filesystem route discovery and route contracts.
- `@devjs/server`: development HTTP server with diagnostics and reload events.
- `@devjs/build`: production HTML output and build manifest generation.
- `@devjs/cli`: command-line interface.

## Getting Started

```sh
pnpm install
pnpm build
pnpm test
pnpm test:e2e
```

Run the starter app:

```sh
pnpm starter:doctor
pnpm starter:dev
```

Open `http://127.0.0.1:3000`.

Build static output:

```sh
pnpm starter:build
```

The output is written to `examples/hello-devjs/dist/devjs`.

## Quality Checks

Run these locally before sharing changes:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm bench
```

## Notes

This repository intentionally does not include GitHub Actions or CI setup. For now, InnovateX contributors can run the local commands above.
