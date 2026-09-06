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
    const postHtml = await readFile(
      resolve(starterRoot, "dist/devjs/posts/getting-started.html"),
      "utf8",
    );
    const robots = await readFile(resolve(starterRoot, "dist/devjs/robots.txt"), "utf8");

    expect(result.routes.map((route) => route.path)).toEqual([
      "/",
      "/about",
      "/posts/getting-started",
      "/posts/architecture",
    ]);
    expect(html).toContain("Build from one platform.");
    expect(postHtml).toContain("Post: getting-started");
    expect(robots).toContain("User-agent");
  });

  it("serves route output over HTTP", async () => {
    const server = await startDevServer({
      cwd: starterRoot,
      port: 3231,
      watch: false,
    });

    try {
      const about = await fetch("http://127.0.0.1:3231/about");
      const post = await fetch("http://127.0.0.1:3231/posts/architecture");
      const robots = await fetch("http://127.0.0.1:3231/robots.txt");

      expect(about.status).toBe(200);
      expect(await about.text()).toContain("About hello-devjs");
      expect(post.status).toBe(200);
      expect(await post.text()).toContain("Post: architecture");
      expect(robots.status).toBe(200);
      expect(await robots.text()).toContain("User-agent");
    } finally {
      await server.close();
    }
  });
});
