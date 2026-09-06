import { describe, expect, it } from "vitest";
import { useState } from "./hooks.js";
import { type DevComponent, Fragment, h, renderToString, resolveRenderOutput } from "./index.js";
import { getInternals } from "./types.js";

describe("h", () => {
  it("creates element vnodes", () => {
    const vnode = h("div", { className: "card" }, "Hello");
    expect(vnode.type).toBe("div");
    expect(vnode.props.className).toBe("card");
    expect(vnode.props.children).toBe("Hello");
  });

  it("supports fragments", () => {
    const html = renderToString(h(Fragment, {}, h("span", {}, "a"), h("span", {}, "b")));
    expect(html).toBe("<span>a</span><span>b</span>");
  });
});

describe("renderToString", () => {
  it("renders nested components", () => {
    const Title: DevComponent<{ text: string }> = ({ text }) => h("h1", {}, text);

    const Page: DevComponent = () => h("main", {}, h(Title, { text: "dev.js ui" }));

    expect(renderToString(h(Page, {}))).toBe("<main><h1>dev.js ui</h1></main>");
  });

  it("escapes text and attributes", () => {
    expect(renderToString(h("p", { title: "<script>" }, "<unsafe>"))).toBe(
      '<p title="&lt;script&gt;">&lt;unsafe&gt;</p>',
    );
  });

  it("skips event handlers during ssr", () => {
    expect(renderToString(h("button", { onClick: () => undefined }, "Go"))).toBe(
      "<button>Go</button>",
    );
  });

  it("renders void elements", () => {
    expect(renderToString(h("input", { type: "text", value: "x" }))).toBe(
      '<input type="text" value="x">',
    );
  });
});

describe("hooks", () => {
  it("renders stateful components on the server", () => {
    const Counter: DevComponent<{ initial: number }> = ({ initial }) => {
      const [count] = useState(initial);
      return h("span", {}, `Count: ${count}`);
    };

    getInternals().currentInstance = null;
    expect(renderToString(h(Counter, { initial: 3 }))).toBe("<span>Count: 3</span>");
  });
});

describe("resolveRenderOutput", () => {
  it("passes through html strings", () => {
    expect(resolveRenderOutput("<main>ok</main>")).toBe("<main>ok</main>");
  });

  it("renders vnodes to html", () => {
    expect(resolveRenderOutput(h("strong", {}, "ok"))).toBe("<strong>ok</strong>");
  });
});
