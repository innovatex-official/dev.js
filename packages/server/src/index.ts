import { watch } from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  formatDiagnostic,
  hasDiagnosticErrors,
  type LoadedProject,
  loadProject,
} from "@devjs/project";
import { discoverRoutes, isRouteModule, matchRoute, type RouteManifest } from "@devjs/router";

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

  const route = matchRoute(manifest, url.pathname);

  if (!route) {
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
    const module = (await import(
      `${pathToFileURL(route.filePath).href}?t=${Date.now()}`
    )) as unknown;

    if (!isRouteModule(module)) {
      sendHtml(
        response,
        500,
        renderRouteError(route.filePath, "Route module must export render()."),
      );
      return;
    }

    const body = await module.render({ project, params: {}, url });
    sendHtml(
      response,
      200,
      renderDocument({
        title: project.kernel.plan.project,
        body,
        diagnostics: project.diagnostics.map(formatDiagnostic),
      }),
    );
  } catch (error) {
    sendHtml(
      response,
      500,
      renderRouteError(
        route.filePath,
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
