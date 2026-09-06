import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  formatDiagnostic,
  hasDiagnosticErrors,
  type LoadedProject,
  loadProject,
} from "@devjs/project";
import {
  discoverRoutes,
  hasClientComponent,
  isRouteModule,
  matchRoute,
  type RouteManifest,
} from "@devjs/router";
import { resolveRenderOutput } from "@devjs/ui";
import * as esbuild from "esbuild";

const require = createRequire(import.meta.url);
const uiEntry = require.resolve("@devjs/ui");
const uiClientEntry = require.resolve("@devjs/ui/client");
const uiJsxEntry = require.resolve("@devjs/ui/jsx-runtime");

export type DevServerOptions = Readonly<{
  cwd: string;
  host?: string;
  port?: number;
  watch?: boolean;
}>;

export type DevServer = Readonly<{
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}>;

type SseClient = ServerResponse;

export async function startDevServer(options: DevServerOptions): Promise<DevServer> {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 3000;
  let project = await loadProject({ cwd: options.cwd, mode: "development" });
  let manifest = await discoverRoutes(project.root);
  const clients = new Set<SseClient>();
  const watcher =
    options.watch === false
      ? undefined
      : watch(project.root, { recursive: true }, async () => {
          project = await loadProject({ cwd: options.cwd, mode: "development" });
          manifest = await discoverRoutes(project.root);
          broadcastReload(clients);
        });

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

    if (url.pathname === "/__devjs/events") {
      openEventStream(response, clients);
      return;
    }

    if (url.pathname === "/__devjs/diagnostics") {
      sendJson(response, {
        diagnostics: project.diagnostics,
        routes: manifest.routes,
      });
      return;
    }

    if (url.pathname === "/__devjs/ui-client.js") {
      const bundle = await readUiClientBundle();
      sendJavaScript(response, bundle);
      return;
    }

    if (url.pathname.startsWith("/__devjs/client/") && url.pathname.endsWith(".js")) {
      const route = manifest.routes.find((entry) => routeClientPath(entry.path) === url.pathname);
      if (!route) {
        response.writeHead(404);
        response.end("Route client bundle not found.");
        return;
      }

      try {
        const bundle = await bundleRouteClient(route.filePath);
        sendJavaScript(response, bundle);
      } catch (error) {
        response.writeHead(500);
        response.end(error instanceof Error ? error.message : String(error));
      }
      return;
    }

    if (await tryServePublicAsset(response, project.root, url.pathname)) {
      return;
    }

    await renderRequest(response, project, manifest, url);
  });

  await new Promise<void>((resolvePromise) => {
    server.listen(port, host, resolvePromise);
  });

  return Object.freeze({
    host,
    port,
    url: `http://${host}:${port}`,
    close: () =>
      new Promise<void>((resolvePromise, reject) => {
        watcher?.close();
        for (const client of clients) {
          client.end();
        }
        server.close((error) => (error ? reject(error) : resolvePromise()));
      }),
  });
}

export function renderDocument(input: {
  title: string;
  body: string;
  diagnostics: readonly string[];
  clientScript?: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(input.title)}</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; background: #0b0d12; color: #f6f7fb; }
      a { color: inherit; }
      .devjs-error { margin: 24px; padding: 16px; border: 1px solid #ef4444; border-radius: 12px; background: #2a1010; }
    </style>
  </head>
  <body>
    <div id="root">${input.body}</div>
    ${renderOverlay(input.diagnostics)}
    <script type="module">
      const events = new EventSource("/__devjs/events");
      events.addEventListener("reload", () => location.reload());
    </script>
    ${input.clientScript ? `<script type="module">${input.clientScript}</script>` : ""}
  </body>
</html>`;
}

async function renderRequest(
  response: ServerResponse,
  project: LoadedProject,
  manifest: RouteManifest,
  url: URL,
): Promise<void> {
  if (hasDiagnosticErrors(project.diagnostics)) {
    sendHtml(response, 500, renderDiagnosticsPage(project));
    return;
  }

  const matched = matchRoute(manifest, url.pathname);

  if (!matched) {
    sendHtml(
      response,
      404,
      renderDocument({
        title: "Not found",
        body: `<main class="devjs-error"><h1>Route not found</h1><p>${escapeHtml(url.pathname)}</p></main>`,
        diagnostics: [],
      }),
    );
    return;
  }

  try {
    const module = (await loadRouteModule(matched.route.filePath)) as unknown;

    if (!isRouteModule(module)) {
      sendHtml(
        response,
        500,
        renderRouteError(matched.route.filePath, "Route module must export render()."),
      );
      return;
    }

    const body = resolveRenderOutput(await module.render({ project, params: matched.params, url }));
    const clientScript = hasClientComponent(module)
      ? `import "${routeClientPath(matched.route.path)}";`
      : undefined;

    sendHtml(
      response,
      200,
      renderDocument({
        title: project.kernel.plan.project,
        body,
        diagnostics: project.diagnostics.map(formatDiagnostic),
        ...(clientScript ? { clientScript } : {}),
      }),
    );
  } catch (error) {
    sendHtml(
      response,
      500,
      renderRouteError(
        matched.route.filePath,
        error instanceof Error ? (error.stack ?? error.message) : String(error),
      ),
    );
  }
}

function renderDiagnosticsPage(project: LoadedProject): string {
  return renderDocument({
    title: "dev.js diagnostics",
    body: `<main class="devjs-error"><h1>Project diagnostics failed</h1><pre>${escapeHtml(
      project.diagnostics.map(formatDiagnostic).join("\n"),
    )}</pre></main>`,
    diagnostics: project.diagnostics.map(formatDiagnostic),
  });
}

function renderRouteError(filePath: string, message: string): string {
  return renderDocument({
    title: "dev.js route error",
    body: `<main class="devjs-error"><h1>Route error</h1><p>${escapeHtml(filePath)}</p><pre>${escapeHtml(
      message,
    )}</pre></main>`,
    diagnostics: [message],
  });
}

function renderOverlay(diagnostics: readonly string[]): string {
  if (diagnostics.length === 0) {
    return "";
  }

  return `<aside class="devjs-error" role="alert"><strong>dev.js diagnostics</strong><pre>${escapeHtml(
    diagnostics.join("\n"),
  )}</pre></aside>`;
}

function openEventStream(response: ServerResponse, clients: Set<SseClient>): void {
  response.writeHead(200, {
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
  });
  response.write("event: ready\ndata: {}\n\n");
  clients.add(response);
  response.on("close", () => clients.delete(response));
}

function broadcastReload(clients: Set<SseClient>): void {
  for (const client of clients) {
    client.write("event: reload\ndata: {}\n\n");
  }
}

function sendJson(response: ServerResponse, data: unknown): void {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data, null, 2));
}

function sendJavaScript(response: ServerResponse, source: string): void {
  response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
  response.end(source);
}

function sendHtml(response: ServerResponse, statusCode: number, html: string): void {
  response.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function defaultPublicDirectory(root: string): string {
  return join(root, "public");
}

export async function loadRouteModule(filePath: string): Promise<unknown> {
  const extension = filePath.split(".").pop();

  if (extension === "ts" || extension === "tsx") {
    const result = await esbuild.build({
      entryPoints: [filePath],
      bundle: true,
      write: false,
      format: "esm",
      platform: "node",
      target: "node20",
      jsx: "automatic",
      jsxImportSource: "@devjs/ui",
      alias: {
        "@devjs/ui": uiEntry,
        "@devjs/ui/client": uiClientEntry,
        "@devjs/ui/jsx-runtime": uiJsxEntry,
      },
      packages: "external",
    });

    const code = result.outputFiles[0]?.text;
    if (!code) {
      throw new Error(`Failed to transpile route module: ${filePath}`);
    }

    const url = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
    return import(url);
  }

  return import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
}

async function readUiClientBundle(): Promise<string> {
  return readFile(uiClientEntry, "utf8");
}

export async function bundleRouteClient(routeFilePath: string): Promise<string> {
  const entry = `
    import { hydrateApp } from "@devjs/ui/client";
    import { component } from ${JSON.stringify(routeFilePath)};
    const root = document.getElementById("root");
    if (!root) {
      throw new Error("Missing #root container for dev.js hydration.");
    }
    hydrateApp(component, root);
  `;

  const result = await esbuild.build({
    stdin: {
      contents: entry,
      loader: "ts",
      resolveDir: dirname(routeFilePath),
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2020",
    jsx: "automatic",
    jsxImportSource: "@devjs/ui",
    alias: {
      "@devjs/ui/client": uiClientEntry,
      "@devjs/ui": uiEntry,
      "@devjs/ui/jsx-runtime": uiJsxEntry,
    },
  });

  const output = result.outputFiles[0]?.text;
  if (!output) {
    throw new Error(`Failed to bundle client route: ${routeFilePath}`);
  }

  return output;
}

export function routeClientPath(routePath: string): string {
  const normalized = routePath === "/" ? "index" : routePath.slice(1).replaceAll("/", "-");
  return `/__devjs/client/${normalized}.js`;
}

const mimeTypes: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function tryServePublicAsset(
  response: ServerResponse,
  projectRoot: string,
  pathname: string,
): Promise<boolean> {
  if (pathname.startsWith("/__devjs/")) {
    return false;
  }

  const relativePath = pathname === "/" ? "" : pathname.slice(1);
  const filePath = join(defaultPublicDirectory(projectRoot), relativePath);
  const publicRoot = defaultPublicDirectory(projectRoot);
  if (!filePath.startsWith(publicRoot)) {
    return false;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return false;
    }

    const content = await readFile(filePath);
    const mimeType = mimeTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    response.writeHead(200, { "Content-Type": mimeType });
    response.end(content);
    return true;
  } catch {
    return false;
  }
}
