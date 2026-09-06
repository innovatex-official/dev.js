import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderHelp, runCli } from "./index.js";

const repoRoot = resolve(process.cwd(), "../..");
const starterRoot = resolve(repoRoot, "examples/hello-devjs");

describe("runCli", () => {
  it("prints help by default", async () => {
    await expect(runCli(["node", "devjs"])).resolves.toMatchObject({
      exitCode: 0,
      stdout: expect.stringContaining("Usage:"),
    });
  });

  it("prints the current version", async () => {
    await expect(runCli(["node", "devjs", "version"])).resolves.toEqual({
      exitCode: 0,
      stdout: "dev.js 0.0.0",
      stderr: "",
    });
  });

  it("runs doctor against a real project", async () => {
    const result = await runCli(["node", "devjs", "doctor"], {
      cwd: repoRoot,
      env: { NODE_ENV: "development" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Status: ready");
    expect(result.stdout).toContain("Project: dev.js");
  });

  it("prints doctor diagnostics as JSON", async () => {
    const result = await runCli(["node", "devjs", "doctor", "--json"], {
      cwd: repoRoot,
      env: { NODE_ENV: "development" },
    });

    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "ready",
      project: "dev.js",
    });
  });

  it("builds a DevJS project", async () => {
    const result = await runCli(["node", "devjs", "build"], {
      cwd: starterRoot,
      env: { NODE_ENV: "production" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Built hello-devjs");
  });

  it("starts and closes the dev server in once mode", async () => {
    const result = await runCli(["node", "devjs", "dev", "--port", "3219", "--once"], {
      cwd: starterRoot,
      env: { NODE_ENV: "development" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("http://127.0.0.1:3219");
  });

  it("rejects unknown commands", async () => {
    const result = await runCli(["node", "devjs", "unknown"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown command: unknown");
  });

  it("scaffolds a new project", async () => {
    const target = resolve(repoRoot, `tmp-init-${crypto.randomUUID()}`);
    const result = await runCli(["node", "devjs", "init", "demo-app"], {
      cwd: target,
      env: { NODE_ENV: "development" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("demo-app");
    await rm(resolve(target, "demo-app"), { force: true, recursive: true });
    await rm(target, { force: true, recursive: true });
  });
});

describe("renderHelp", () => {
  it("documents supported commands", () => {
    expect(renderHelp()).toContain("devjs doctor");
    expect(renderHelp()).toContain("devjs build");
    expect(renderHelp()).toContain("devjs init");
  });
});
