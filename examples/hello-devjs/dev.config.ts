import { defineConfig } from "@devjs/config";
import { definePlugin } from "@devjs/plugin";

const pages = definePlugin({
  name: "hello-pages",
  setup({ cwd, mode }) {
    console.log(`hello-pages ready in ${mode} mode at ${cwd}`);
  },
});

export default defineConfig({
  name: "hello-devjs",
  plugins: [pages],
});
