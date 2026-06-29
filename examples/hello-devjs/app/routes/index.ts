import type { RouteContext } from "@devjs/router";

export function render({ project }: RouteContext): string {
  const plugins = project.kernel.plan.pluginNames.join(", ") || "none";

  return `<main class="page-shell">
    <section class="hero">
      <p class="eyebrow">dev.js starter</p>
      <h1>Build from one platform.</h1>
      <p class="lede">
        This page is rendered through the local DevJS route system, development server,
        project loader, and production builder.
      </p>
      <div class="actions">
        <a href="/about">View route example</a>
        <code>${project.kernel.plan.project}</code>
      </div>
    </section>
    <section class="panel">
      <h2>Project state</h2>
      <dl>
        <div><dt>Mode</dt><dd>${project.kernel.plan.mode}</dd></div>
        <div><dt>Plugins</dt><dd>${plugins}</dd></div>
        <div><dt>Packages</dt><dd>${project.workspace.packages.length}</dd></div>
      </dl>
    </section>
  </main>
  <style>
    .page-shell { min-height: 100vh; display: grid; place-items: center; gap: 24px; padding: 48px; background: radial-gradient(circle at top left, #1d4ed8 0, transparent 32%), #09090b; }
    .hero, .panel { width: min(920px, 100%); border: 1px solid rgba(255,255,255,.12); border-radius: 24px; background: rgba(255,255,255,.06); padding: 32px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
    .eyebrow { color: #93c5fd; text-transform: uppercase; letter-spacing: .14em; font-size: 12px; font-weight: 700; }
    h1 { margin: 0; font-size: clamp(48px, 8vw, 96px); line-height: .92; letter-spacing: -.06em; }
    .lede { max-width: 680px; color: #cbd5e1; font-size: 20px; line-height: 1.6; }
    .actions { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .actions a { color: #020617; background: #f8fafc; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 700; }
    code { color: #bfdbfe; }
    dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
    dt { color: #94a3b8; font-size: 13px; }
    dd { margin: 4px 0 0; font-size: 24px; font-weight: 700; }
  </style>`;
}
