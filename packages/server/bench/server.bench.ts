import { Bench } from "tinybench";
import { renderDocument } from "../src/index.js";

const bench = new Bench({ time: 100 });

bench.add("renderDocument", () => {
  renderDocument({ title: "hello", body: "<main>Hello</main>", diagnostics: [] });
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
