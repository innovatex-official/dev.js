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

## Done: UI Library

- Add `@devjs/ui` with components, hooks, fragments, and context.
- Add server rendering via `renderToString`.
- Add client rendering and hydration via `@devjs/ui/client`.
- Add JSX/TSX support through `jsx-runtime`.
- Integrate component routes with the dev server and static build.

## Done: Production Platform Features

- Dynamic route params (`/posts/[slug]`) with `staticPaths` prerendering.
- Static asset serving from `public/`.
- Production client bundles in `dist/devjs/assets`.
- Client router (`Link`, `RouterProvider`, `useRouter`).
- Error boundaries and `@devjs/ui/testing` utilities.
- `devjs init` project scaffolding.

## Done: Advanced Runtime

- Module-level HMR with client remount via SSE `hmr` events.
- Suspense, `lazy()`, `startTransition`, and `useTransition`.
- Full `useContext` Provider tree with nested values.
- Deployment adapters via `@devjs/deploy` and `devjs deploy vercel|netlify`.
- npm publish metadata for public packages (`@devjs/ui`, `@devjs/deploy`, and related packages).

## Next: Better Developer Experience

- Add clearer error pages for config and route failures.
- Add richer dev overlay for route and build diagnostics.
- Add plugin examples beyond the core contracts.

## Later: Framework Research

- Explore a compiler or bundler integration.
- Explore concurrent rendering scheduling.
- Explore package graph dependency edges.
