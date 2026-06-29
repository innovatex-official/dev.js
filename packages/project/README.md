# @devjs/project

Project loading, workspace discovery, and diagnostics for dev.js.

## Responsibility

This package owns filesystem-aware project orchestration. It finds the project root, loads `dev.config.ts`, discovers workspace packages, validates high-level project state, and returns stable diagnostics for CLI and editor integrations.

## Public API

- `loadProject(options)` loads config, workspace packages, diagnostics, and a platform kernel.
- `discoverWorkspace(root)` reads package manager metadata and workspace packages.
- `hasDiagnosticErrors(diagnostics)` checks whether a project can proceed.
- `formatDiagnostic(diagnostic)` renders stable human-readable output.

## Security Notes

Config loading executes user-controlled project code. Future RFCs must define the sandbox and permission model before plugins are allowed to perform privileged operations.
