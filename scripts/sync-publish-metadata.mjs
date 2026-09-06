#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const packagesDir = new URL("../packages", import.meta.url).pathname;

for (const name of [
  "config",
  "plugin",
  "runtime",
  "core",
  "project",
  "router",
  "server",
  "build",
  "cli",
  "ui",
  "deploy",
]) {
  const file = join(packagesDir, name, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = "0.1.0";
  pkg.license = pkg.license ?? "MIT";
  pkg.publishConfig = { access: "public" };
  pkg.repository = pkg.repository ?? {
    type: "git",
    url: "https://github.com/innovatex-official/dev.js.git",
    directory: `packages/${name}`,
  };
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log("Updated publish metadata for @devjs packages.");
