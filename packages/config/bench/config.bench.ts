import { Bench } from "tinybench";
import { normalizeConfig } from "../src/index.js";

const bench = new Bench({ time: 100 });

bench.add("normalizeConfig", () => {
  normalizeConfig({ name: "bench-app" }, { root: "/repo", mode: "production" });
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
