import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type DeployTarget = "vercel" | "netlify";

export type DeployOptions = Readonly<{
  cwd: string;
  target: DeployTarget;
  outDir?: string;
}>;

export type DeployResult = Readonly<{
  target: DeployTarget;
  outDir: string;
  files: readonly string[];
}>;

export async function deployProject(options: DeployOptions): Promise<DeployResult> {
  const outDir = options.outDir ?? join(options.cwd, "dist", "devjs");

  switch (options.target) {
    case "vercel":
      return deployVercel(options.cwd, outDir);
    case "netlify":
      return deployNetlify(options.cwd, outDir);
    default:
      throw new Error(`Unsupported deploy target: ${options.target}`);
  }
}

async function deployVercel(cwd: string, outDir: string): Promise<DeployResult> {
  const vercelJson = join(cwd, "vercel.json");
  const config = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    buildCommand: "pnpm build",
    outputDirectory: relativeOutput(cwd, outDir),
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      {
        source: "/assets/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ],
  };

  await writeFile(vercelJson, `${JSON.stringify(config, null, 2)}\n`);

  return Object.freeze({
    target: "vercel",
    outDir,
    files: Object.freeze([vercelJson]),
  });
}

async function deployNetlify(cwd: string, outDir: string): Promise<DeployResult> {
  const netlifyToml = join(cwd, "netlify.toml");
  const redirects = join(outDir, "_redirects");
  const publish = relativeOutput(cwd, outDir);

  await writeFile(
    netlifyToml,
    `[build]
  command = "pnpm build"
  publish = "${publish}"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`,
  );

  await mkdir(outDir, { recursive: true });
  await writeFile(redirects, "/*    /index.html   404\n");

  return Object.freeze({
    target: "netlify",
    outDir,
    files: Object.freeze([netlifyToml, redirects]),
  });
}

function relativeOutput(cwd: string, outDir: string): string {
  return outDir.startsWith(cwd) ? outDir.slice(cwd.length + 1) : outDir;
}

export function formatDeploySummary(result: DeployResult): string {
  return `Prepared ${result.target} deployment config (${result.files.length} files) for ${result.outDir}.`;
}
