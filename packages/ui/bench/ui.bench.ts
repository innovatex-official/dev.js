import { Bench } from "tinybench";
import { h } from "../src/h.js";
import { renderToString } from "../src/ssr.js";

const bench = new Bench();

function List({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, index) =>
    h("li", { key: index }, `Item ${index}`),
  );
  return h("ul", {}, items);
}

bench.add("renderToString small tree", () => {
  renderToString(h("main", {}, h("h1", {}, "Hello"), h("p", {}, "World")));
});

bench.add("renderToString list(50)", () => {
  renderToString(h(List, { count: 50 }));
});

await bench.run();
console.table(bench.table());
