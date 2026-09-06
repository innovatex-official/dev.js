# dev.js

dev.js is an experimental TypeScript developer-platform prototype from InnovateX, a CS lab community.

Repository: https://github.com/innovatex-official/dev.js

This project was built for exploration and learning. It includes a full-stack platform and a React-alternative UI library (`@devjs/ui`) with components, hooks, SSR, and client hydration.

## What Works

- `devjs doctor` loads a project and reports diagnostics.
- `devjs dev` starts a local HTTP development server with module-level HMR.
- `devjs build` writes static HTML output to `dist/devjs`.
- `devjs deploy vercel|netlify` writes deployment config for static hosting.
- `devjs init` scaffolds new applications.
- Filesystem routes render pages from `app/routes` using `@devjs/ui` components.
- JSX/TSX route modules with `useState`, `useEffect`, `useContext`, and other hooks.
- Server-side rendering via `renderToString` and client hydration for interactive routes.
- Dynamic route params (`/posts/[slug]`) with `staticPaths` for production builds.
- Static asset serving from `public/` and production asset bundling.
- Client router (`Link`, `RouterProvider`) and error boundaries.
- Suspense, `lazy()`, and `startTransition` for async UI.
- Testing utilities via `@devjs/ui/testing`.
- The `hello-devjs` starter proves the end-to-end flow.

## Project Scope

dev.js currently supports a small but complete framework slice:

- config loading
- plugin contracts
- project diagnostics
- workspace discovery
- route discovery
- component-based UI rendering (`@devjs/ui`)
- development HTTP serving with client bundling and HMR
- static HTML build output
- deployment adapters
- CLI commands

It does not yet include a full compiler pipeline, database layer, auth layer, or stable public API guarantees.

## Packages

- `@devjs/plugin`: public plugin contract.
- `@devjs/config`: configuration schema and normalization.
- `@devjs/runtime`: runtime planning primitives.
- `@devjs/core`: platform kernel composition.
- `@devjs/project`: project loading, workspace discovery, and diagnostics.
- `@devjs/router`: filesystem route discovery and route contracts.
- `@devjs/ui`: React-alternative UI library (components, hooks, SSR, hydration).
- `@devjs/server`: development HTTP server with diagnostics and HMR events.
- `@devjs/build`: production HTML output and build manifest generation.
- `@devjs/deploy`: Vercel and Netlify deployment adapters.
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

Prepare deployment config:

```sh
cd examples/hello-devjs
pnpm build
devjs deploy vercel
```

## Publishing

Public packages are versioned at `0.1.0` and include npm `publishConfig`. After local validation:

```sh
pnpm publish:packages
```

See `docs/release.md` for the full release checklist.

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
