import { defineConfig } from "@devjs/config";
import { definePlugin } from "@devjs/plugin";

const routes = definePlugin({
  name: "example-routes",
  setup() {
    return undefined;
  },
});

export default defineConfig({
  name: "minimal-app",
  plugins: [routes],
});
