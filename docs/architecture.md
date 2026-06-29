# Architecture

## Current Milestone

dev.js currently implements a small end-to-end framework slice for learning and experimentation.

## Package Graph

```text
@devjs/plugin
      |
@devjs/config
      |
@devjs/runtime
      |
@devjs/core
      |
@devjs/project
      |
@devjs/router
      |
@devjs/server
      |
@devjs/build
      |
@devjs/cli
```

## Package Boundaries

- `@devjs/plugin` defines extension contracts only.
- `@devjs/config` validates and normalizes project configuration.
- `@devjs/runtime` converts normalized configuration into execution plans.
- `@devjs/core` composes platform primitives into a kernel.
- `@devjs/project` owns filesystem-aware loading, workspace discovery, and diagnostics.
- `@devjs/router` discovers route files and defines the route module contract.
- `@devjs/server` serves route modules over HTTP and exposes diagnostics.
- `@devjs/build` writes static HTML route output and a build manifest.
- `@devjs/cli` owns terminal commands and human-facing output.

## Data Flow

```text
dev.config.ts -> normalized config -> runtime plan -> project diagnostics -> route discovery -> dev server or static build -> CLI output
```

## Performance Model

Core package APIs are deterministic and side-effect-light. Filesystem and network behavior is isolated in `@devjs/project`, `@devjs/server`, and `@devjs/build`.

## Security Model

Config loading, plugin execution, file-system access, process spawning, and network access are explicit security boundaries. This is a local lab framework; do not run untrusted projects.
