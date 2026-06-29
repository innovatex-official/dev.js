import { Bench } from "tinybench";
import { runCli } from "../src/index.js";

const bench = new Bench({ time: 100 });

bench.add("runCli help", () => {
  runCli(["node", "devjs", "help"]);
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
