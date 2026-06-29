# @devjs/config

Configuration schema and normalization helpers for dev.js projects.

## Responsibility

This package owns config shape, validation, and default application. It does not read from disk or execute user code.

## Public API

- `defineConfig(config)` validates and freezes a user config object.
- `normalizeConfig(config, defaults)` returns the complete runtime config consumed by other packages.
