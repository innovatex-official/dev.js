import { describe, expect, it } from "vitest";
import { formatBuildSummary } from "./index.js";

describe("formatBuildSummary", () => {
  it("renders a stable build summary", () => {
    expect(
      formatBuildSummary({
        project: "hello",
        outDir: "/repo/dist/devjs",
        routes: [
          {
            path: "/",
            filePath: "/repo/app/routes/index.ts",
            outputPath: "/repo/dist/devjs/index.html",
          },
        ],
        diagnostics: [],
      }),
    ).toBe("Built hello to /repo/dist/devjs (1 routes).");
  });
});
