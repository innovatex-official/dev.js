# @devjs/router

Filesystem route discovery and route-module contracts for dev.js.

## Route Convention

Routes live in `app/routes`.

- `app/routes/index.ts` maps to `/`.
- `app/routes/about.ts` maps to `/about`.
- `app/routes/docs/index.ts` maps to `/docs`.

Each route module exports `render(context)`.
