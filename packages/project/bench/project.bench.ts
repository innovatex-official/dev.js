import { Bench } from "tinybench";
import { hasDiagnosticErrors } from "../src/index.js";

const diagnostics = Object.freeze([
  Object.freeze({
    code: "DEVJS_PROJECT_READY" as const,
    severity: "info" as const,
    message: "Project is ready.",
  }),
]);

const bench = new Bench({ time: 100 });

bench.add("hasDiagnosticErrors", () => {
  hasDiagnosticErrors(diagnostics);
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
