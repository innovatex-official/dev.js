# Hello DevJS

A small project that consumes the local dev.js platform packages.

## Run It

From the repository root:

```sh
pnpm --filter hello-devjs doctor
pnpm --filter hello-devjs dev
pnpm --filter hello-devjs build
pnpm --filter hello-devjs start
```

From this folder:

```sh
pnpm doctor
pnpm dev
pnpm build
pnpm start
```

## What This Shows

- `dev.config.ts` defines a DevJS project with a typed plugin.
- `app/routes/index.ts` and `app/routes/about.ts` render browser pages.
- `devjs dev` serves those routes through the local HTTP server.
- `devjs build` writes static HTML output to `dist/devjs`.
- `devjs doctor` loads the project, discovers packages, and prints diagnostics.
