import type { NormalizedPlatformConfig } from "@devjs/config";

export type RuntimeCapability = "build" | "dev-server" | "test" | "deploy";

export type RuntimePlan = Readonly<{
  project: string;
  root: string;
  mode: NormalizedPlatformConfig["mode"];
  capabilities: readonly RuntimeCapability[];
  pluginNames: readonly string[];
}>;

export function createRuntimePlan(
  config: NormalizedPlatformConfig,
  capabilities: readonly RuntimeCapability[],
): RuntimePlan {
  return Object.freeze({
    project: config.name,
    root: config.root,
    mode: config.mode,
    capabilities: Object.freeze([...new Set(capabilities)]),
    pluginNames: Object.freeze(config.plugins.map((plugin) => plugin.name)),
  });
}

export function hasCapability(plan: RuntimePlan, capability: RuntimeCapability): boolean {
  return plan.capabilities.includes(capability);
}
