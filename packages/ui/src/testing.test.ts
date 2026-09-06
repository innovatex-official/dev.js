import { describe, expect, it } from "vitest";
import { h, renderToString } from "./index.js";
import { renderComponent, screen } from "./testing.js";

describe("testing utilities", () => {
  it("renders components to html", () => {
    const result = renderComponent(() => h("h1", {}, "Hello"), {});
    expect(result.html).toBe("<h1>Hello</h1>");
    expect(screen(result.html).getByText("Hello")).toBe(true);
  });
});

describe("error boundary", () => {
  it("renders fallback content from the server renderer", async () => {
    const { ErrorBoundary } = await import("./error-boundary.js");
    const html = renderToString(
      h(ErrorBoundary, {
        fallback: (error: Error) => h("p", {}, error.message),
        children: h("span", {}, "safe"),
      }),
    );
    expect(html).toContain("safe");
  });
});
