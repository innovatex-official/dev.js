import type { Dirent } from "node:fs";
import { readdir as readdirAsync } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import type { LoadedProject } from "@devjs/project";
import type { DevComponent } from "@devjs/ui";

export type RouteContext = Readonly<{
  project: LoadedProject;
  params: Readonly<Record<string, string>>;
  url: URL;
}>;

export type RouteRenderResult = string | import("@devjs/ui").DevNode;

export type RouteModule = Readonly<{
  render: (context: RouteContext) => RouteRenderResult | Promise<RouteRenderResult>;
  component?: DevComponent;
}>;

export type RouteDefinition = Readonly<{
  path: string;
  filePath: string;
}>;

export type RouteManifest = Readonly<{
  root: string;
  routes: readonly RouteDefinition[];
}>;

const routeExtensions = new Set([".js", ".mjs", ".ts", ".tsx"]);

export async function discoverRoutes(root: string): Promise<RouteManifest> {
  const routesRoot = join(root, "app", "routes");
  const files = await readRouteFiles(routesRoot);
  const routes = files
    .map((filePath) => createRouteDefinition(routesRoot, filePath))
    .sort((left, right) => left.path.localeCompare(right.path));

  return Object.freeze({
    root: routesRoot,
    routes: Object.freeze(routes),
  });
}

export function matchRoute(manifest: RouteManifest, pathname: string): RouteDefinition | undefined {
  const normalized = normalizePathname(pathname);
  return manifest.routes.find((route) => route.path === normalized);
}

export function createRouteDefinition(routesRoot: string, filePath: string): RouteDefinition {
  const extension = extname(filePath);
  const withoutExtension = relative(routesRoot, filePath).slice(0, -extension.length);
  const parts = withoutExtension.split(sep).filter(Boolean);
  const routeParts = parts.at(-1) === "index" ? parts.slice(0, -1) : parts;
  const routePath = `/${routeParts.join("/")}`;

  return Object.freeze({
    path: normalizePathname(routePath),
    filePath,
  });
}

export function isRouteModule(value: unknown): value is RouteModule {
  return (
    typeof value === "object" &&
    value !== null &&
    "render" in value &&
    typeof (value as { render: unknown }).render === "function"
  );
}

export function hasClientComponent(value: RouteModule): boolean {
  return typeof value.component === "function";
}

async function readRouteFiles(directory: string): Promise<string[]> {
  let entries: Dirent[];

  try {
    entries = await readdirAsync(directory, { withFileTypes: true });
  } catch {
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await readRouteFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && routeExtensions.has(extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function normalizePathname(pathname: string): string {
  if (pathname === "" || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
