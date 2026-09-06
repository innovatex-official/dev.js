import type { RouteContext } from "@devjs/router";
import type { DevComponent } from "@devjs/ui";
import { renderToString } from "@devjs/ui";

function PostPage({ params }: RouteContext) {
  return (
    <main style={{ padding: "48px", fontFamily: "Inter, system-ui, sans-serif", color: "#f8fafc" }}>
      <a href="/" style={{ color: "#93c5fd" }}>
        Back home
      </a>
      <h1 style={{ fontSize: "48px" }}>Post: {params.slug}</h1>
      <p style={{ color: "#cbd5e1" }}>
        This dynamic route proves param extraction works in dev and production builds.
      </p>
    </main>
  );
}

export const component: DevComponent<RouteContext> = (props) => <PostPage {...props} />;

export function staticPaths(): readonly string[] {
  return ["getting-started", "architecture"];
}

export function render(context: RouteContext): string {
  return renderToString(<PostPage {...context} />);
}
