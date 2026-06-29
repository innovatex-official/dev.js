import { defineConfig } from "@devjs/config";
import { definePlugin } from "@devjs/plugin";

const workspacePlugin = definePlugin({
  name: "devjs-workspace",
});

export default defineConfig({
  name: "dev.js",
  plugins: [workspacePlugin],
});
