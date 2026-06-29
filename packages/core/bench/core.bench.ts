import { Bench } from "tinybench";
import { createPlatform } from "../src/index.js";

const bench = new Bench({ time: 100 });

bench.add("createPlatform", () => {
  createPlatform({ name: "bench-app", plugins: [{ name: "router" }] }, { cwd: "/repo" });
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
