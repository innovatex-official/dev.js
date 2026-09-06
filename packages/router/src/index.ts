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
  staticPaths?: () => readonly string[] | Promise<readonly string[]>;
}>;

export type RouteDefinition = Readonly<{
  path: string;
  filePath: string;
  dynamic: boolean;
}>;

export type RouteManifest = Readonly<{
  root: string;
  routes: readonly RouteDefinition[];
}>;

export type MatchedRoute = Readonly<{
  route: RouteDefinition;
  params: Readonly<Record<string, string>>;
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

export function matchRoute(manifest: RouteManifest, pathname: string): MatchedRoute | undefined {
  const normalized = normalizePathname(pathname);

  for (const route of manifest.routes) {
    const params = matchPathPattern(route.path, normalized);
    if (params) {
      return Object.freeze({ route, params: Object.freeze(params) });
    }
  }

  return undefined;
}

export function createRouteDefinition(routesRoot: string, filePath: string): RouteDefinition {
  const extension = extname(filePath);
  const withoutExtension = relative(routesRoot, filePath).slice(0, -extension.length);
  const parts = withoutExtension.split(sep).filter(Boolean);
  const routeParts = parts.at(-1) === "index" ? parts.slice(0, -1) : parts;
  const segments = routeParts.map(segmentToRouteSegment);
  const routePath = `/${segments.join("/")}`;
  const dynamic = segments.some((segment) => segment.startsWith(":"));

  return Object.freeze({
    path: normalizePathname(routePath),
    filePath,
    dynamic,
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

export function matchPathPattern(
  pattern: string,
  pathname: string,
): Readonly<Record<string, string>> | undefined {
  const patternParts = pattern === "/" ? [] : pattern.slice(1).split("/");
  const pathParts = pathname === "/" ? [] : pathname.slice(1).split("/");

  if (patternParts.length !== pathParts.length) {
    return undefined;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index];
    const pathPart = pathParts[index];

    if (!patternPart || pathPart === undefined) {
      return undefined;
    }

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return undefined;
    }
  }

  return params;
}

function segmentToRouteSegment(segment: string): string {
  if (segment.startsWith("[") && segment.endsWith("]")) {
    return `:${segment.slice(1, -1)}`;
  }

  return segment;
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
