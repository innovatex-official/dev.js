import { describe, expect, it } from "vitest";
import { type DevComponent, h, renderToString } from "./index.js";
import { lazy, Suspense, startTransition, useTransition } from "./suspense.js";
import { getInternals } from "./types.js";

describe("Suspense", () => {
  it("renders fallback while lazy modules are pending", () => {
    const Remote: DevComponent = () => h("strong", {}, "loaded");

    const LazyRemote = lazy(async () => ({ default: Remote }));

    const Page: DevComponent = () =>
      h(Suspense, { fallback: h("em", {}, "loading") }, h(LazyRemote, {}));

    getInternals().currentInstance = null;
    expect(renderToString(h(Page, {}))).toBe("<em>loading</em>");
  });
});

describe("lazy", () => {
  it("resolves to the default export component", async () => {
    const Widget: DevComponent<{ label: string }> = ({ label }) => h("b", {}, label);
    const LazyWidget = lazy(async () => ({ default: Widget }));

    try {
      LazyWidget({ label: "two" });
    } catch (value) {
      if (value instanceof Promise) {
        await value;
      }
    }

    getInternals().currentInstance = null;
    expect(renderToString(LazyWidget({ label: "two" }))).toBe("<b>two</b>");
  });
});

describe("startTransition", () => {
  it("exposes pending state through useTransition", async () => {
    const Tracker: DevComponent = () => {
      const [isPending] = useTransition();
      return h("i", {}, isPending ? "pending" : "idle");
    };

    getInternals().currentInstance = null;
    startTransition(() => {
      expect(renderToString(h(Tracker, {}))).toBe("<i>pending</i>");
    });

    await new Promise((resolve) => queueMicrotask(resolve));
    getInternals().currentInstance = null;
    expect(renderToString(h(Tracker, {}))).toBe("<i>idle</i>");
  });
});
