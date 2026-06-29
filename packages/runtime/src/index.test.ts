import { describe, expect, it } from "vitest";
import { createRuntimePlan, hasCapability } from "./index.js";

describe("createRuntimePlan", () => {
  it("creates an immutable deduplicated runtime plan", () => {
    const plan = createRuntimePlan(
      {
        name: "web-app",
        root: "/repo",
        mode: "production",
        plugins: [{ name: "router" }],
      },
      ["build", "build", "test"],
    );

    expect(plan).toEqual({
      project: "web-app",
      root: "/repo",
      mode: "production",
      capabilities: ["build", "test"],
      pluginNames: ["router"],
    });
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.capabilities)).toBe(true);
  });
});

describe("hasCapability", () => {
  it("checks whether a runtime plan supports a capability", () => {
    const plan = createRuntimePlan({ name: "web-app", root: "/repo", mode: "test", plugins: [] }, [
      "test",
    ]);

    expect(hasCapability(plan, "test")).toBe(true);
    expect(hasCapability(plan, "deploy")).toBe(false);
  });
});
