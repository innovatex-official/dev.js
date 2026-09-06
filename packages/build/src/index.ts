import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { formatDiagnostic, hasDiagnosticErrors, loadProject } from "@devjs/project";
import { discoverRoutes, isRouteModule } from "@devjs/router";
import { loadRouteModule, renderDocument } from "@devjs/server";
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
  const diagnostics = project.diagnostics.map(formatDiagnostic);

  if (hasDiagnosticErrors(project.diagnostics)) {
    throw new Error(diagnostics.join("\n"));
  }

  await rm(outDir, { force: true, recursive: true });
  await mkdir(outDir, { recursive: true });

  const outputs: BuildRouteOutput[] = [];

  for (const route of manifest.routes) {
    const module = (await loadRouteModule(route.filePath)) as unknown;

    if (!isRouteModule(module)) {
      throw new Error(`Route module ${route.filePath} must export render().`);
    }

    const html = renderDocument({
      title: project.kernel.plan.project,
      body: resolveRenderOutput(
        await module.render({
          project,
          params: {},
          url: new URL(route.path, "https://devjs.local"),
        }),
      ),
      diagnostics,
    });
    const outputPath = join(
      outDir,
      route.path === "/" ? "index.html" : `${route.path.slice(1)}.html`,
    );
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);

    outputs.push(
      Object.freeze({
        path: route.path,
        filePath: route.filePath,
        outputPath,
      }),
    );
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

export function formatBuildSummary(result: BuildResult): string {
  return `Built ${result.project} to ${result.outDir} (${result.routes.length} routes).`;
}
