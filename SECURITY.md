# Security Policy

## Status

dev.js is an experimental InnovateX lab project. It is not recommended for production workloads yet.

## Reporting Security Issues

If you find a security issue, report it privately to the InnovateX maintainers instead of posting exploit details publicly.

- Affected package and version
- Reproduction steps
- Expected impact
- Known mitigations

## Security Principles

- Treat config execution, plugins, file-system access, and process spawning as high-risk boundaries.
- Prefer explicit permissions over ambient authority.
- Avoid network access in core packages unless explicitly required.
- Keep dependency surfaces small and auditable.

## Current Limitations

`dev.config.ts` and route modules execute local project code. Do not run untrusted DevJS projects.
