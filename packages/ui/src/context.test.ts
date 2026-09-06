import { describe, expect, it } from "vitest";
import { createContext } from "./context.js";
import { useContext } from "./hooks.js";
import { type DevComponent, h, renderToString } from "./index.js";
import { getInternals } from "./types.js";

describe("createContext", () => {
  it("provides nested values through Provider components", () => {
    const Theme = createContext("light");

    const Label: DevComponent = () => {
      const theme = useContext(Theme);
      return h("span", {}, theme);
    };

    const Page: DevComponent = () =>
      h(Theme.Provider, { value: "dark" }, h(Theme.Provider, { value: "neon" }, h(Label, {})));

    getInternals().currentInstance = null;
    expect(renderToString(h(Page, {}))).toBe("<span>neon</span>");
  });

  it("falls back to the default value outside providers", () => {
    const Locale = createContext("en");

    const Greeting: DevComponent = () => {
      const locale = useContext(Locale);
      return h("p", {}, locale);
    };

    getInternals().currentInstance = null;
    expect(renderToString(h(Greeting, {}))).toBe("<p>en</p>");
  });
});
