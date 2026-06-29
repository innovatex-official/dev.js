# @devjs/core

Core platform kernel for dev.js.

## Responsibility

This package composes config and runtime primitives into the minimal kernel that higher-level tooling can consume. It avoids file-system and process side effects so it can stay deterministic and easy to test.

## Public API

- `createPlatform(config, options)` creates an immutable platform kernel.
- `getPlatformSummary(kernel)` renders a stable human-readable summary for logs and CLI output.
