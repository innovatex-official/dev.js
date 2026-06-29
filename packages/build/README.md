# @devjs/build

Production build output for dev.js applications.

## Output

`buildProject()` writes static HTML route output and a `manifest.json` file to `dist/devjs` by default.

This is intentionally small today: it validates the end-to-end route and render lifecycle before a future compiler/bundler RFC expands the production pipeline.
