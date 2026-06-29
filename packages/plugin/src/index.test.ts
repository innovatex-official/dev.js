import { describe, expect, it } from "vitest";
import { createHookContext, definePlugin } from "./index.js";

describe("definePlugin", () => {
  it("freezes the plugin contract", () => {
    const plugin = definePlugin({ name: "example" });

    expect(plugin.name).toBe("example");
    expect(Object.isFrozen(plugin)).toBe(true);
  });

  it("rejects empty plugin names", () => {
    expect(() => definePlugin({ name: " " })).toThrow("Plugin name must not be empty.");
  });
});

describe("createHookContext", () => {
  it("creates an immutable hook context", () => {
    const context = createHookContext({ cwd: "/repo", mode: "development" });

    expect(context).toEqual({ cwd: "/repo", mode: "development" });
    expect(Object.isFrozen(context)).toBe(true);
  });
});
