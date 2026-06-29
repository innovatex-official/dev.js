import { Bench } from "tinybench";
import { createRuntimePlan } from "../src/index.js";

const bench = new Bench({ time: 100 });

bench.add("createRuntimePlan", () => {
  createRuntimePlan(
    { name: "bench-app", root: "/repo", mode: "production", plugins: [{ name: "router" }] },
    ["build", "dev-server", "build"],
  );
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
