import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { formatDiagnostic, hasDiagnosticErrors, loadProject } from "@devjs/project";
import { discoverRoutes, hasClientComponent, isRouteModule, matchPathPattern } from "@devjs/router";
import {
  bundleRouteClient,
  defaultPublicDirectory,
  loadRouteModule,
  renderDocument,
} from "@devjs/server";
import { resolveRenderOutput } from "@devjs/ui";

export type BuildOptions = Readonly<{
  cwd: string;
  outDir?: string;
}>;

export type BuildRouteOutput = Readonly<{
  path: string;
  filePath: string;
  outputPath: string;
}>;

export type BuildResult = Readonly<{
  project: string;
  outDir: string;
  routes: readonly BuildRouteOutput[];
  diagnostics: readonly string[];
}>;

export async function buildProject(options: BuildOptions): Promise<BuildResult> {
  const project = await loadProject({ cwd: options.cwd, mode: "production" });
  const manifest = await discoverRoutes(project.root);
  const outDir = options.outDir ?? join(project.root, "dist", "devjs");
  const assetsDir = join(outDir, "assets");
  const diagnostics = project.diagnostics.map(formatDiagnostic);

  if (hasDiagnosticErrors(project.diagnostics)) {
    throw new Error(diagnostics.join("\n"));
  }

  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  await copyPublicAssets(defaultPublicDirectory(project.root), outDir);

  const outputs: BuildRouteOutput[] = [];

  for (const route of manifest.routes) {
    const module = (await loadRouteModule(route.filePath)) as unknown;

    if (!isRouteModule(module)) {
      throw new Error(`Route module ${route.filePath} must export render().`);
    }

    const paths = await resolveBuildPaths(route, module);
    const clientAsset = hasClientComponent(module)
      ? await writeClientBundle(route, assetsDir)
      : undefined;

    for (const buildPath of paths) {
      const params = matchPathPattern(route.path, buildPath) ?? {};
      const html = renderDocument({
        title: project.kernel.plan.project,
        body: resolveRenderOutput(
          await module.render({
            project,
            params,
            url: new URL(buildPath, "https://devjs.local"),
          }),
        ),
        diagnostics,
        ...(clientAsset ? { clientScript: `import "${clientAsset}";` } : {}),
      });
      const outputPath = routeOutputPath(outDir, buildPath);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, html);

      outputs.push(
        Object.freeze({
          path: buildPath,
          filePath: route.filePath,
          outputPath,
        }),
      );
    }
  }

  await writeFile(
    join(outDir, "manifest.json"),
    JSON.stringify(
      {
        project: project.kernel.plan.project,
        routes: outputs,
        diagnostics,
      },
      null,
      2,
    ),
  );

  return Object.freeze({
    project: project.kernel.plan.project,
    outDir,
    routes: Object.freeze(outputs),
    diagnostics: Object.freeze(diagnostics),
  });
}

async function resolveBuildPaths(
  route: { path: string; dynamic: boolean },
  module: { staticPaths?: () => readonly string[] | Promise<readonly string[]> },
): Promise<readonly string[]> {
  if (!route.dynamic) {
    return [route.path];
  }

  if (typeof module.staticPaths !== "function") {
    return [];
  }

  const values = await module.staticPaths();
  return values.map((value) => {
    const pattern = route.path;
    const key = pattern.slice(pattern.lastIndexOf(":") + 1);
    return pattern.replace(`:${key}`, encodeURIComponent(value));
  });
}

async function writeClientBundle(
  route: { path: string; filePath: string },
  assetsDir: string,
): Promise<string> {
  const assetName = routeClientAssetName(route.path);
  const bundle = await bundleRouteClient(route.filePath);
  await writeFile(join(assetsDir, assetName), bundle);
  return `/assets/${assetName}`;
}

function routeClientAssetName(routePath: string): string {
  const normalized = routePath === "/" ? "index" : routePath.slice(1).replaceAll("/", "-");
  return `client-${normalized}.js`;
}

function routeOutputPath(outDir: string, routePath: string): string {
  if (routePath === "/") {
    return join(outDir, "index.html");
  }

  return join(outDir, `${routePath.slice(1)}.html`);
}

async function copyPublicAssets(publicDir: string, outDir: string): Promise<void> {
  try {
    const entries = await readdir(publicDir, { withFileTypes: true });
    for (const entry of entries) {
      await cp(join(publicDir, entry.name), join(outDir, entry.name), { recursive: true });
    }
  } catch {
    // Optional public directory.
  }
}

export function formatBuildSummary(result: BuildResult): string {
  return `Built ${result.project} to ${result.outDir} (${result.routes.length} routes).`;
}
