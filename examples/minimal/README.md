# Minimal Example

This example shows the intended consumer shape for a dev.js project.

```ts
import { defineConfig } from "@devjs/config";
import { definePlugin } from "@devjs/plugin";

export default defineConfig({
  name: "minimal-app",
  plugins: [definePlugin({ name: "example-routes" })]
});
```

Run `pnpm --filter devjs-minimal-example doctor` after installing dependencies.
