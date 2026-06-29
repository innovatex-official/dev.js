import { Bench } from "tinybench";
import { matchRoute } from "../src/index.js";

const manifest = Object.freeze({
  root: "/repo/app/routes",
  routes: Object.freeze([
    Object.freeze({ path: "/", filePath: "/repo/app/routes/index.ts" }),
    Object.freeze({ path: "/about", filePath: "/repo/app/routes/about.ts" }),
  ]),
});

const bench = new Bench({ time: 100 });

bench.add("matchRoute", () => {
  matchRoute(manifest, "/about");
});

await bench.run();

console.table(
  bench.tasks.map((task) => ({
    name: task.name,
    opsPerSecond: Math.round(task.result?.throughput.mean ?? 0),
  })),
);
