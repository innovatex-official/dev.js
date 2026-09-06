import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createRouteDefinition,
  discoverRoutes,
  isRouteModule,
  matchPathPattern,
  matchRoute,
} from "./index.js";

describe("discoverRoutes", () => {
  it("discovers filesystem routes", async () => {
    const root = join(tmpdir(), `devjs-router-${crypto.randomUUID()}`);
    await mkdir(join(root, "app/routes/docs"), { recursive: true });
    await writeFile(join(root, "app/routes/index.ts"), "export const render = () => '';");
    await writeFile(join(root, "app/routes/about.ts"), "export const render = () => '';");
    await writeFile(join(root, "app/routes/docs/index.ts"), "export const render = () => '';");

    const manifest = await discoverRoutes(root);

    expect(manifest.routes.map((route) => route.path)).toEqual(["/", "/about", "/docs"]);
  });

  it("maps dynamic route segments", async () => {
    const root = join(tmpdir(), `devjs-router-${crypto.randomUUID()}`);
    await mkdir(join(root, "app/routes/posts"), { recursive: true });
    await writeFile(join(root, "app/routes/posts/[slug].ts"), "export const render = () => '';");

    const manifest = await discoverRoutes(root);

    expect(manifest.routes[0]).toEqual({
      path: "/posts/:slug",
      filePath: join(root, "app/routes/posts/[slug].ts"),
      dynamic: true,
    });
  });
});

describe("matchRoute", () => {
  it("matches normalized paths", () => {
    const route = Object.freeze({
      path: "/about",
      filePath: "/repo/app/routes/about.ts",
      dynamic: false,
    });

    expect(matchRoute({ root: "/repo/app/routes", routes: [route] }, "/about/")).toEqual({
      route,
      params: {},
    });
  });

  it("extracts dynamic params", () => {
    const route = Object.freeze({
      path: "/posts/:slug",
      filePath: "/repo/app/routes/posts/[slug].ts",
      dynamic: true,
    });

    expect(matchRoute({ root: "/repo/app/routes", routes: [route] }, "/posts/hello")).toEqual({
      route,
      params: { slug: "hello" },
    });
  });
});

describe("matchPathPattern", () => {
  it("returns undefined for mismatched paths", () => {
    expect(matchPathPattern("/posts/:slug", "/posts")).toBeUndefined();
  });
});

describe("createRouteDefinition", () => {
  it("maps index files to the root route", () => {
    expect(createRouteDefinition("/repo/app/routes", "/repo/app/routes/index.ts")).toEqual({
      path: "/",
      filePath: "/repo/app/routes/index.ts",
      dynamic: false,
    });
  });
});

describe("isRouteModule", () => {
  it("checks the route module contract", () => {
    expect(isRouteModule({ render: () => "" })).toBe(true);
    expect(isRouteModule({})).toBe(false);
  });
});
