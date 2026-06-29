import type { RouteContext } from "@devjs/router";

export function render({ project }: RouteContext): string {
  return `<main style="min-height:100vh;padding:48px;background:#0f172a;color:#f8fafc;font-family:Inter,system-ui,sans-serif">
    <a href="/" style="color:#93c5fd">Back home</a>
    <h1 style="font-size:64px;letter-spacing:-.05em">About ${project.kernel.plan.project}</h1>
    <p style="max-width:680px;font-size:20px;line-height:1.6;color:#cbd5e1">
      This second route proves filesystem routing, route matching, HTML rendering,
      and production output are all connected.
    </p>
  </main>`;
}
