import { describe, expect, it } from "vitest";
import { defaultPublicDirectory, renderDocument } from "./index.js";

describe("renderDocument", () => {
  it("renders body content and diagnostics overlay", () => {
    const html = renderDocument({
      title: "hello",
      body: "<main>Hello</main>",
      diagnostics: ["INFO DEVJS_PROJECT_READY"],
    });

    expect(html).toContain("<main>Hello</main>");
    expect(html).toContain("INFO DEVJS_PROJECT_READY");
    expect(html).toContain("/__devjs/events");
    expect(html).toContain('addEventListener("hmr"');
  });

  it("escapes document title", () => {
    expect(renderDocument({ title: "<x>", body: "", diagnostics: [] })).toContain("&lt;x&gt;");
  });
});

describe("defaultPublicDirectory", () => {
  it("returns the project public directory", () => {
    expect(defaultPublicDirectory("/repo")).toBe("/repo/public");
  });
});
