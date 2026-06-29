import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatDiagnostic, hasDiagnosticErrors, loadProject } from "./index.js";

describe("loadProject", () => {
  it("loads config, discovers workspace packages, and creates a kernel", async () => {
    const root = await createFixture({
      config: `export default { name: "fixture-app", plugins: [{ name: "routes" }] };`,
      packages: [{ directory: "packages/web", name: "@fixture/web" }],
    });

    const project = await loadProject({ cwd: root, configFile: "dev.config.mjs", mode: "test" });

    expect(project.kernel.plan).toMatchObject({
      project: "fixture-app",
      mode: "test",
      pluginNames: ["routes"],
    });
    expect(project.workspace.packages.map((workspacePackage) => workspacePackage.name)).toEqual([
      "@fixture/web",
      "fixture-root",
    ]);
    expect(hasDiagnosticErrors(project.diagnostics)).toBe(false);
    expect(project.diagnostics.at(-1)).toMatchObject({ code: "DEVJS_PROJECT_READY" });
  });

  it("reports missing config files as stable diagnostics", async () => {
    const root = await createFixture({ config: null, packages: [] });

    const project = await loadProject({ cwd: root, configFile: "dev.config.mjs" });

    expect(hasDiagnosticErrors(project.diagnostics)).toBe(true);
    expect(project.diagnostics).toContainEqual(
      expect.objectContaining({ code: "DEVJS_CONFIG_NOT_FOUND", severity: "error" }),
    );
  });

  it("reports duplicate plugin names", async () => {
    const root = await createFixture({
      config: `export default { name: "fixture-app", plugins: [{ name: "routes" }, { name: "routes" }] };`,
      packages: [],
    });

    const project = await loadProject({ cwd: root, configFile: "dev.config.mjs" });

    expect(project.diagnostics).toContainEqual(
      expect.objectContaining({ code: "DEVJS_DUPLICATE_PLUGIN", severity: "error" }),
    );
  });
});

describe("formatDiagnostic", () => {
  it("renders diagnostics for CLI output", () => {
    expect(
      formatDiagnostic({
        code: "DEVJS_PROJECT_READY",
        severity: "info",
        message: "Project is ready.",
      }),
    ).toBe("INFO DEVJS_PROJECT_READY: Project is ready.");
  });
});

async function createFixture(input: {
  config: string | null;
  packages: readonly { directory: string; name: string }[];
}): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "devjs-project-"));

  await writeFile(
    join(root, "package.json"),
    JSON.stringify({
      name: "fixture-root",
      version: "0.0.0",
      private: true,
      packageManager: "pnpm@9.15.4",
    }),
  );
  await writeFile(join(root, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');

  if (input.config !== null) {
    await writeFile(join(root, "dev.config.mjs"), input.config);
  }

  for (const workspacePackage of input.packages) {
    const packagePath = join(root, workspacePackage.directory);
    await mkdir(packagePath, { recursive: true });
    await writeFile(
      join(packagePath, "package.json"),
      JSON.stringify({
        name: workspacePackage.name,
        version: "0.0.0",
        private: true,
      }),
    );
  }

  return root;
}
