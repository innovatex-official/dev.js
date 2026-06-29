import { normalizeConfig, type PlatformConfig } from "@devjs/config";
import { createRuntimePlan, type RuntimeCapability, type RuntimePlan } from "@devjs/runtime";

export type PlatformKernel = Readonly<{
  plan: RuntimePlan;
  startedAt: Date;
}>;

export type CreatePlatformOptions = Readonly<{
  cwd: string;
  mode?: "development" | "production" | "test";
  capabilities?: readonly RuntimeCapability[];
}>;

export function createPlatform(
  config: PlatformConfig,
  options: CreatePlatformOptions,
): PlatformKernel {
  const normalized = normalizeConfig(config, {
    root: options.cwd,
    mode: options.mode ?? "development",
  });

  return Object.freeze({
    plan: createRuntimePlan(normalized, options.capabilities ?? ["build", "dev-server", "test"]),
    startedAt: new Date(),
  });
}

export function getPlatformSummary(kernel: PlatformKernel): string {
  return `${kernel.plan.project} (${kernel.plan.mode}) at ${kernel.plan.root}`;
}
