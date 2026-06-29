import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../../packages/cli/src/index.js";

describe("cli smoke", () => {
  it("returns a successful doctor result", async () => {
    const result = await runCli(["node", "devjs", "doctor"], {
      cwd: resolve(process.cwd()),
      env: { NODE_ENV: "development" },
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Status: ready");
    expect(result.stdout).toContain("Project: dev.js");
    expect(result.stderr).toBe("");
  });
});
