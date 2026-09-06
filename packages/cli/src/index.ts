import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildProject, formatBuildSummary } from "@devjs/build";
import {
  formatDiagnostic,
  hasDiagnosticErrors,
  type LoadedProject,
  loadProject,
} from "@devjs/project";
import { startDevServer } from "@devjs/server";

export type CliResult = Readonly<{
  exitCode: number;
  stdout: string;
  stderr: string;
}>;

export type CliRuntime = Readonly<{
  cwd: string;
  env: NodeJS.ProcessEnv;
}>;

export async function runCli(
  argv: readonly string[],
  runtime: CliRuntime = { cwd: process.cwd(), env: process.env },
): Promise<CliResult> {
  const command = argv[2] ?? "help";

  switch (command) {
    case "--version":
    case "version":
      return ok("dev.js 0.0.0");
    case "doctor":
      return runDoctor(argv, runtime);
    case "build":
      return runBuild(runtime);
    case "dev":
      return runDev(argv, runtime);
    case "init":
      return runInit(argv, runtime);
    case "help":
    case "--help":
    case "-h":
      return ok(renderHelp());
    default:
      return {
        exitCode: 1,
        stdout: "",
        stderr: `Unknown command: ${command}\n\n${renderHelp()}`,
      };
  }
}

async function runDoctor(argv: readonly string[], runtime: CliRuntime): Promise<CliResult> {
  const project = await loadProject({
    cwd: runtime.cwd,
    mode: runtime.env.NODE_ENV === "production" ? "production" : "development",
  });
  const stdout = argv.includes("--json") ? renderDoctorJson(project) : renderDoctor(project);

  return {
    exitCode: hasDiagnosticErrors(project.diagnostics) ? 1 : 0,
    stdout,
    stderr: "",
  };
}

async function runBuild(runtime: CliRuntime): Promise<CliResult> {
  try {
    const result = await buildProject({ cwd: runtime.cwd });
    return ok(formatBuildSummary(result));
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runInit(argv: readonly string[], runtime: CliRuntime): Promise<CliResult> {
  const name = argv[3] ?? "my-devjs-app";

  try {
    const root = await initProject({ cwd: runtime.cwd, name });
    return ok(`Created dev.js app at ${root}`);
  } catch (error) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runDev(argv: readonly string[], runtime: CliRuntime): Promise<CliResult> {
  const port = parsePort(argv) ?? 3000;
  const server = await startDevServer({
    cwd: runtime.cwd,
    port,
    watch: !argv.includes("--no-watch"),
  });

  if (argv.includes("--once")) {
    await server.close();
  }

  return ok(`dev.js server ready at ${server.url}`);
}

export function renderHelp(): string {
  return `dev.js

Usage:
  devjs dev             Start the development server
  devjs dev --port 4000 Start the development server on a custom port
  devjs build           Build production HTML output
  devjs init [name]     Create a new dev.js application
  devjs doctor          Validate the current project environment
  devjs doctor --json   Print diagnostics as JSON
  devjs version         Print the CLI version
  devjs help            Show this help message`;
}

function ok(stdout: string): CliResult {
  return { exitCode: 0, stdout, stderr: "" };
}

function renderDoctor(project: LoadedProject): string {
  const status = hasDiagnosticErrors(project.diagnostics) ? "failed" : "ready";
  const diagnostics = project.diagnostics.map(formatDiagnostic).join("\n");

  return `dev.js doctor
Status: ${status}
Project: ${project.kernel.plan.project}
Root: ${project.root}
Packages: ${project.workspace.packages.length}

${diagnostics}`;
}

function renderDoctorJson(project: LoadedProject): string {
  return JSON.stringify(
    {
      status: hasDiagnosticErrors(project.diagnostics) ? "failed" : "ready",
      project: project.kernel.plan.project,
      root: project.root,
      configPath: project.configPath,
      packages: project.workspace.packages,
      diagnostics: project.diagnostics,
    },
    null,
    2,
  );
}

function parsePort(argv: readonly string[]): number | undefined {
  const portIndex = argv.indexOf("--port");
  const raw = portIndex >= 0 ? argv[portIndex + 1] : undefined;

  if (!raw) {
    return undefined;
  }

  const port = Number.parseInt(raw, 10);
  return Number.isInteger(port) && port > 0 ? port : undefined;
}

async function initProject(options: { cwd: string; name: string }): Promise<string> {
  const root = join(options.cwd, options.name);
  await mkdir(join(root, "app", "routes"), { recursive: true });
  await mkdir(join(root, "app", "components"), { recursive: true });
  await mkdir(join(root, "public"), { recursive: true });

  await writeFile(
    join(root, "dev.config.ts"),
    `import { defineConfig } from "@devjs/config";

export default defineConfig({
  name: "${options.name}",
});
`,
  );

  await writeFile(
    join(root, "package.json"),
    JSON.stringify(
      {
        name: options.name,
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: {
          build: "node ../../packages/cli/dist/index.js build",
          dev: "node ../../packages/cli/dist/index.js dev",
          doctor: "node ../../packages/cli/dist/index.js doctor",
          typecheck: "tsc --noEmit",
        },
        dependencies: {
          "@devjs/cli": "workspace:*",
          "@devjs/config": "workspace:*",
          "@devjs/ui": "workspace:*",
        },
        devDependencies: {
          "@types/node": "latest",
          typescript: "latest",
        },
      },
      null,
      2,
    ),
  );

  await writeFile(
    join(root, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          noEmit: true,
          jsx: "react-jsx",
          jsxImportSource: "@devjs/ui",
          types: ["node"],
        },
        include: ["app/**/*.ts", "app/**/*.tsx", "dev.config.ts"],
      },
      null,
      2,
    ),
  );

  await writeFile(
    join(root, "app", "routes", "index.tsx"),
    `import type { RouteContext } from "@devjs/router";
import { renderToString } from "@devjs/ui";

function HomePage({ project }: RouteContext) {
  return (
    <main style={{ padding: "48px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>Welcome to {project.kernel.plan.project}</h1>
      <p>Your dev.js app is ready.</p>
      <a href="/about">About</a>
    </main>
  );
}

export const component = HomePage;

export function render(context: RouteContext): string {
  return renderToString(<HomePage {...context} />);
}
`,
  );

  await writeFile(join(root, "public", "robots.txt"), "User-agent: *\nAllow: /\n");

  return root;
}

async function main(): Promise<void> {
  const result = await runCli(process.argv);

  if (result.stdout.length > 0) {
    console.log(result.stdout);
  }

  if (result.stderr.length > 0) {
    console.error(result.stderr);
  }

  process.exitCode = result.exitCode;
}

if (process.argv[1]?.endsWith("devjs") || process.argv[1]?.endsWith("index.js")) {
  void main();
}
