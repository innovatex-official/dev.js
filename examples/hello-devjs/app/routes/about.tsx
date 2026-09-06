import type { RouteContext } from "@devjs/router";
import type { DevComponent } from "@devjs/ui";
import { renderToString } from "@devjs/ui";

function AboutPage({ project }: RouteContext) {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px",
        background: "#0f172a",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <a href="/" style={{ color: "#93c5fd" }}>
        Back home
      </a>
      <h1 style={{ fontSize: "64px", letterSpacing: "-.05em" }}>
        About {project.kernel.plan.project}
      </h1>
      <p style={{ maxWidth: "680px", fontSize: "20px", lineHeight: 1.6, color: "#cbd5e1" }}>
        This second route proves filesystem routing, component rendering, SSR, and production output
        are all connected.
      </p>
    </main>
  );
}

export const component: DevComponent<RouteContext> = (props) => <AboutPage {...props} />;

export function render(context: RouteContext): string {
  return renderToString(<AboutPage {...context} />);
}
