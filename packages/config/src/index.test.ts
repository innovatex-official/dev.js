import { describe, expect, it } from "vitest";
import { defineConfig, normalizeConfig } from "./index.js";

describe("defineConfig", () => {
  it("freezes project config and plugins", () => {
    const config = defineConfig({ name: "web-app", plugins: [{ name: "router" }] });

    expect(config.name).toBe("web-app");
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.plugins)).toBe(true);
  });

  it("rejects invalid project names", () => {
    expect(() => defineConfig({ name: "Web App" })).toThrow("Project name must start");
  });
});

describe("normalizeConfig", () => {
  it("applies defaults without mutating the source config", () => {
    const config = { name: "web-app" };

    expect(normalizeConfig(config, { root: "/repo", mode: "development" })).toEqual({
      name: "web-app",
      root: "/repo",
      mode: "development",
      plugins: [],
    });
  });
});
