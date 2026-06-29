import { describe, expect, it } from "vitest";
import { createPlatform, getPlatformSummary } from "./index.js";

describe("createPlatform", () => {
  it("creates an immutable platform kernel", () => {
    const kernel = createPlatform(
      { name: "web-app", plugins: [{ name: "router" }] },
      { cwd: "/repo", mode: "test", capabilities: ["build"] },
    );

    expect(kernel.plan).toMatchObject({
      project: "web-app",
      root: "/repo",
      mode: "test",
      capabilities: ["build"],
      pluginNames: ["router"],
    });
    expect(kernel.startedAt).toBeInstanceOf(Date);
    expect(Object.isFrozen(kernel)).toBe(true);
  });
});

describe("getPlatformSummary", () => {
  it("renders a concise summary for logs and CLI output", () => {
    const kernel = createPlatform({ name: "web-app" }, { cwd: "/repo", mode: "development" });

    expect(getPlatformSummary(kernel)).toBe("web-app (development) at /repo");
  });
});
