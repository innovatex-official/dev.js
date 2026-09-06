import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deployProject, formatDeploySummary } from "./index.js";

describe("deployProject", () => {
  it("writes vercel config", async () => {
    const cwd = join(process.cwd(), `tmp-deploy-${crypto.randomUUID()}`);
    await mkdir(cwd, { recursive: true });

    const result = await deployProject({ cwd, target: "vercel", outDir: join(cwd, "dist/devjs") });

    expect(result.target).toBe("vercel");
    expect(formatDeploySummary(result)).toContain("vercel");
    await writeFile(join(cwd, ".cleanup"), "");
  });

  it("writes netlify config", async () => {
    const cwd = join(process.cwd(), `tmp-deploy-${crypto.randomUUID()}`);
    await mkdir(cwd, { recursive: true });

    const result = await deployProject({ cwd, target: "netlify", outDir: join(cwd, "dist/devjs") });

    expect(result.files.some((file) => file.endsWith("netlify.toml"))).toBe(true);
  });
});
