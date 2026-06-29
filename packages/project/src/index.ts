import { access, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { PlatformConfig, PlatformMode } from "@devjs/config";
import { createPlatform, type PlatformKernel } from "@devjs/core";
import { parse as parseYaml } from "yaml";

export type DiagnosticSeverity = "info" | "warning" | "error";

export type DiagnosticCode =
  | "DEVJS_CONFIG_NOT_FOUND"
  | "DEVJS_CONFIG_INVALID_EXPORT"
  | "DEVJS_CONFIG_LOAD_FAILED"
  | "DEVJS_DUPLICATE_PLUGIN"
  | "DEVJS_PACKAGE_JSON_INVALID"
  | "DEVJS_PROJECT_READY"
  | "DEVJS_WORKSPACE_EMPTY"
  | "DEVJS_WORKSPACE_GLOB_UNSUPPORTED";

export type ProjectDiagnostic = Readonly<{
  code: DiagnosticCode;
  severity: DiagnosticSeverity;
  message: string;
  filePath?: string;
}>;

export type WorkspacePackage = Readonly<{
  name: string;
  path: string;
  private: boolean;
  version: string | undefined;
}>;

export type WorkspaceGraph = Readonly<{
  root: string;
  packageManager: string | undefined;
  packages: readonly WorkspacePackage[];
}>;

export type LoadedProject = Readonly<{
  root: string;
  configPath: string;
  config: PlatformConfig;
  kernel: PlatformKernel;
  workspace: WorkspaceGraph;
  diagnostics: readonly ProjectDiagnostic[];
}>;

export type LoadProjectOptions = Readonly<{
  cwd: string;
  mode?: PlatformMode;
  configFile?: string;
}>;

type PackageJson = Readonly<{
  name?: string;
  version?: string;
  private?: boolean;
  packageManager?: string;
}>;

type PnpmWorkspace = Readonly<{
  packages?: readonly string[];
}>;

export async function loadProject(options: LoadProjectOptions): Promise<LoadedProject> {
  const root = await findProjectRoot(options.cwd);
  const configPath = resolve(root, options.configFile ?? "dev.config.ts");
  const diagnostics: ProjectDiagnostic[] = [];
  const config = await loadConfig(configPath, diagnostics);
  const workspace = await discoverWorkspace(root, diagnostics);

  diagnostics.push(...validatePluginNames(config));

  const kernel = createPlatform(config, {
    cwd: root,
    mode: options.mode ?? config.mode ?? "development",
  });

  if (!hasDiagnosticErrors(diagnostics)) {
    diagnostics.push(
      createDiagnostic({
        code: "DEVJS_PROJECT_READY",
        severity: "info",
        message: `Project ${config.name} is ready.`,
        filePath: configPath,
      }),
    );
  }

  return Object.freeze({
    root,
    configPath,
    config,
    kernel,
    workspace,
    diagnostics: Object.freeze(diagnostics),
  });
}

export async function findProjectRoot(cwd: string): Promise<string> {
  let current = resolve(cwd);

  for (;;) {
    if (await fileExists(join(current, "package.json"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return resolve(cwd);
    }

    current = parent;
  }
}

export async function discoverWorkspace(
  root: string,
  diagnostics: ProjectDiagnostic[] = [],
): Promise<WorkspaceGraph> {
  const packageJsonPath = join(root, "package.json");
  const packageJson = await readPackageJson(packageJsonPath, diagnostics);
  const workspacePath = join(root, "pnpm-workspace.yaml");
  const workspacePatterns = await readPnpmWorkspacePatterns(workspacePath);
  const packages = await resolveWorkspacePackages(
    root,
    packageJson,
    workspacePatterns,
    diagnostics,
  );

  if (packages.length === 0) {
    diagnostics.push(
      createDiagnostic({
        code: "DEVJS_WORKSPACE_EMPTY",
        severity: "warning",
        message: "No workspace packages were discovered.",
        filePath: workspacePath,
      }),
    );
  }

  return Object.freeze({
    root,
    packageManager: packageJson.packageManager,
    packages: Object.freeze(packages),
  });
}

export function createDiagnostic(input: ProjectDiagnostic): ProjectDiagnostic {
  return Object.freeze({ ...input });
}

export function hasDiagnosticErrors(diagnostics: readonly ProjectDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

export function formatDiagnostic(diagnostic: ProjectDiagnostic): string {
  const location = diagnostic.filePath ? ` ${diagnostic.filePath}` : "";
  return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}${location}: ${diagnostic.message}`;
}

async function loadConfig(
  configPath: string,
  diagnostics: ProjectDiagnostic[],
): Promise<PlatformConfig> {
  if (!(await fileExists(configPath))) {
    diagnostics.push(
      createDiagnostic({
        code: "DEVJS_CONFIG_NOT_FOUND",
        severity: "error",
        message: "Expected dev.config.ts at the project root.",
        filePath: configPath,
      }),
    );
    return { name: "invalid-project" };
  }

  try {
    const module = (await import(`${pathToFileURL(configPath).href}?t=${Date.now()}`)) as {
      default?: unknown;
    };

    if (!isPlatformConfig(module.default)) {
      diagnostics.push(
        createDiagnostic({
          code: "DEVJS_CONFIG_INVALID_EXPORT",
          severity: "error",
          message: "dev.config.ts must default export defineConfig({ name, ... }).",
          filePath: configPath,
        }),
      );
      return { name: "invalid-project" };
    }

    return module.default;
  } catch (error) {
    diagnostics.push(
      createDiagnostic({
        code: "DEVJS_CONFIG_LOAD_FAILED",
        severity: "error",
        message: error instanceof Error ? error.message : "Failed to load dev.config.ts.",
        filePath: configPath,
      }),
    );
    return { name: "invalid-project" };
  }
}

function validatePluginNames(config: PlatformConfig): ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];
  const seen = new Set<string>();

  for (const plugin of config.plugins ?? []) {
    if (seen.has(plugin.name)) {
      diagnostics.push(
        createDiagnostic({
          code: "DEVJS_DUPLICATE_PLUGIN",
          severity: "error",
          message: `Plugin ${plugin.name} is registered more than once.`,
        }),
      );
    }

    seen.add(plugin.name);
  }

  return diagnostics;
}

async function readPackageJson(
  packageJsonPath: string,
  diagnostics: ProjectDiagnostic[],
): Promise<PackageJson> {
  try {
    return JSON.parse(await readFile(packageJsonPath, "utf8")) as PackageJson;
  } catch (error) {
    diagnostics.push(
      createDiagnostic({
        code: "DEVJS_PACKAGE_JSON_INVALID",
        severity: "error",
        message: error instanceof Error ? error.message : "Unable to read package.json.",
        filePath: packageJsonPath,
      }),
    );
    return {};
  }
}

async function readPnpmWorkspacePatterns(workspacePath: string): Promise<readonly string[]> {
  if (!(await fileExists(workspacePath))) {
    return [];
  }

  const workspace = parseYaml(await readFile(workspacePath, "utf8")) as PnpmWorkspace | null;
  return Array.isArray(workspace?.packages) ? workspace.packages : [];
}

async function resolveWorkspacePackages(
  root: string,
  rootPackage: PackageJson,
  patterns: readonly string[],
  diagnostics: ProjectDiagnostic[],
): Promise<WorkspacePackage[]> {
  const packages: WorkspacePackage[] = [];

  if (rootPackage.name) {
    packages.push(
      Object.freeze({
        name: rootPackage.name,
        path: root,
        private: rootPackage.private ?? false,
        version: rootPackage.version,
      }),
    );
  }

  for (const pattern of patterns) {
    if (!pattern.endsWith("/*")) {
      diagnostics.push(
        createDiagnostic({
          code: "DEVJS_WORKSPACE_GLOB_UNSUPPORTED",
          severity: "warning",
          message: `Workspace pattern ${pattern} is not supported yet. Use direct one-level globs like packages/*.`,
        }),
      );
      continue;
    }

    const baseDir = resolve(root, pattern.slice(0, -2));
    const entries = await readPackageDirs(baseDir);

    for (const entry of entries) {
      const packagePath = join(baseDir, entry);
      const packageJson = await readPackageJson(join(packagePath, "package.json"), diagnostics);

      if (packageJson.name) {
        packages.push(
          Object.freeze({
            name: packageJson.name,
            path: packagePath,
            private: packageJson.private ?? false,
            version: packageJson.version,
          }),
        );
      }
    }
  }

  return packages.sort((left, right) => left.name.localeCompare(right.name));
}

async function readPackageDirs(baseDir: string): Promise<string[]> {
  try {
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(baseDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isPlatformConfig(value: unknown): value is PlatformConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string"
  );
}
