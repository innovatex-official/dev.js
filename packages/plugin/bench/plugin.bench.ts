import { Bench } from "tinybench";
import { definePlugin } from "../src/index.js";

const bench = new Bench({ time: 100 });

bench.add("definePlugin", () => {
  definePlugin({ name: "bench-plugin" });
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
