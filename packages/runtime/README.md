# @devjs/runtime

Runtime planning primitives for dev.js applications.

## Responsibility

This package converts normalized project configuration into explicit runtime plans. It does not start servers, compile source, or read project files.

## Public API

- `createRuntimePlan(config, capabilities)` builds an immutable execution plan.
- `hasCapability(plan, capability)` checks whether a capability is enabled.
