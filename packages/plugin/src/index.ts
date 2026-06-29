export type HookContext = Readonly<{
  cwd: string;
  mode: "development" | "production" | "test";
}>;

export type HookResult = void | Promise<void>;

export type PlatformHook = (context: HookContext) => HookResult;

export type PlatformPlugin = Readonly<{
  name: string;
  version?: string;
  setup?: PlatformHook;
  beforeBuild?: PlatformHook;
  afterBuild?: PlatformHook;
}>;

export function definePlugin(plugin: PlatformPlugin): PlatformPlugin {
  if (plugin.name.trim().length === 0) {
    throw new Error("Plugin name must not be empty.");
  }

  return Object.freeze({ ...plugin });
}

export function createHookContext(input: HookContext): HookContext {
  return Object.freeze({ ...input });
}
