import type { PlatformPlugin } from "@devjs/plugin";

export type PlatformMode = "development" | "production" | "test";

export type PlatformConfig = Readonly<{
  name: string;
  root?: string;
  mode?: PlatformMode;
  plugins?: readonly PlatformPlugin[];
}>;

export type NormalizedPlatformConfig = Readonly<{
  name: string;
  root: string;
  mode: PlatformMode;
  plugins: readonly PlatformPlugin[];
}>;

export function defineConfig(config: PlatformConfig): PlatformConfig {
  assertProjectName(config.name);
  return Object.freeze({
    ...config,
    plugins: Object.freeze([...(config.plugins ?? [])]),
  });
}

export function normalizeConfig(
  config: PlatformConfig,
  defaults: Pick<NormalizedPlatformConfig, "root" | "mode">,
): NormalizedPlatformConfig {
  const defined = defineConfig(config);

  return Object.freeze({
    name: defined.name,
    root: defined.root ?? defaults.root,
    mode: defined.mode ?? defaults.mode,
    plugins: Object.freeze([...(defined.plugins ?? [])]),
  });
}

function assertProjectName(name: string): void {
  if (!/^[a-z0-9][a-z0-9._-]*$/u.test(name)) {
    throw new Error(
      "Project name must start with a lowercase letter or number and only include lowercase letters, numbers, dots, underscores, or dashes.",
    );
  }
}
