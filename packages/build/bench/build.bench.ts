import { Bench } from "tinybench";
import { formatBuildSummary } from "../src/index.js";

const result = Object.freeze({
  project: "hello",
  outDir: "/repo/dist/devjs",
  routes: Object.freeze([
    Object.freeze({
      path: "/",
      filePath: "/repo/app/routes/index.ts",
      outputPath: "/repo/dist/devjs/index.html",
    }),
  ]),
  diagnostics: Object.freeze([]),
});

const bench = new Bench({ time: 100 });

bench.add("formatBuildSummary", () => {
  formatBuildSummary(result);
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
