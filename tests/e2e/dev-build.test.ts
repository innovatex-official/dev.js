import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildProject } from "../../packages/build/src/index.js";
import { startDevServer } from "../../packages/server/src/index.js";

const starterRoot = resolve(process.cwd(), "examples/hello-devjs");

describe("dev and build workflow", () => {
  it("builds production route output", async () => {
    const result = await buildProject({ cwd: starterRoot });
    const html = await readFile(resolve(starterRoot, "dist/devjs/index.html"), "utf8");

    expect(result.routes.map((route) => route.path)).toEqual(["/", "/about"]);
    expect(html).toContain("Build from one platform.");
  });

  it("serves route output over HTTP", async () => {
    const server = await startDevServer({
      cwd: starterRoot,
      port: 3231,
      watch: false,
    });

    try {
      const response = await fetch("http://127.0.0.1:3231/about");
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain("About hello-devjs");
    } finally {
      await server.close();
    }
  });
});
