# @devjs/plugin

Typed plugin contracts for extending the dev.js platform.

## Responsibility

This package owns the public extension contract. It intentionally does not know about config loading, build execution, routing, databases, or deployment.

## Public API

- `definePlugin(plugin)` validates and freezes a plugin definition.
- `createHookContext(context)` creates immutable hook context passed to lifecycle hooks.
