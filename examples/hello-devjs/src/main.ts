import { loadProject } from "@devjs/project";

const project = await loadProject({
  cwd: process.cwd(),
  mode: "development",
});

const diagnostics = project.diagnostics
  .map((diagnostic) => `${diagnostic.severity.toUpperCase()} ${diagnostic.code}`)
  .join(", ");

console.log(`Welcome to ${project.kernel.plan.project}.`);
console.log(`Root: ${project.root}`);
console.log(`Plugins: ${project.kernel.plan.pluginNames.join(", ") || "none"}`);
console.log(`Diagnostics: ${diagnostics}`);
