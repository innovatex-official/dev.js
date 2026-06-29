# @devjs/cli

Command-line interface for the dev.js platform.

## Responsibility

This package owns command parsing and human-facing terminal output. Platform behavior belongs in lower-level packages and is composed here.

## Commands

- `devjs doctor` validates the current project environment.
- `devjs version` prints the CLI version.
- `devjs help` prints usage information.
