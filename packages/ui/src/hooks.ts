import {
  type ComponentInstance,
  type DevContext,
  type DevNode,
  type EffectCallback,
  getInternals,
  type HookState,
} from "./types.js";

function currentInstance(): ComponentInstance {
  const instance = getInternals().currentInstance;
  if (!instance) {
    throw new Error("Hooks can only be called inside a component render.");
  }
  return instance;
}

function readHook<T>(create: () => T): T {
  const instance = currentInstance();
  const index = instance.hookIndex;
  const existing = instance.hooks[index];

  if (existing) {
    instance.hookIndex += 1;
    return (existing as { value: T }).value;
  }

  const value = create();
  instance.hooks[index] = { kind: "state", value };
  instance.hookIndex += 1;
  return value;
}

function writeHook<T>(index: number, state: HookState): T {
  const instance = currentInstance();
  instance.hooks[index] = state;
  return (state as { value: T }).value;
}

export function useState<S>(initial: S | (() => S)): [S, (next: S | ((current: S) => S)) => void] {
  const instance = currentInstance();
  const index = instance.hookIndex;
  const existing = instance.hooks[index] as HookState | undefined;

  if (!existing || existing.kind !== "state") {
    const value = typeof initial === "function" ? (initial as () => S)() : initial;
    instance.hooks[index] = { kind: "state", value };
    instance.hookIndex += 1;

    const setState = (next: S | ((current: S) => S)): void => {
      const current = (instance.hooks[index] as { kind: "state"; value: S }).value;
      const resolved = typeof next === "function" ? (next as (current: S) => S)(current) : next;
      if (Object.is(resolved, current)) {
        return;
      }
      writeHook(index, { kind: "state", value: resolved });
      scheduleRender(instance);
    };

    return [value, setState];
  }

  instance.hookIndex += 1;
  const value = existing.value as S;

  const setState = (next: S | ((current: S) => S)): void => {
    const current = (instance.hooks[index] as { kind: "state"; value: S }).value;
    const resolved = typeof next === "function" ? (next as (current: S) => S)(current) : next;
    if (Object.is(resolved, current)) {
      return;
    }
    writeHook(index, { kind: "state", value: resolved });
    scheduleRender(instance);
  };

  return [value, setState];
}

export function useEffect(effect: EffectCallback, deps?: readonly unknown[]): void {
  const instance = currentInstance();
  const index = instance.hookIndex;
  const existing = instance.hooks[index];

  if (!existing || existing.kind !== "effect" || !depsEqual(existing.deps, deps)) {
    instance.hooks[index] = { kind: "effect", deps, run: effect };
    instance.effects.push({ index, deps });
  } else {
    (existing as { run?: EffectCallback }).run = effect;
  }

  instance.hookIndex += 1;
}

export function useLayoutEffect(effect: EffectCallback, deps?: readonly unknown[]): void {
  useEffect(effect, deps);
}

export function useRef<T>(initial: T): { current: T } {
  return readHook(() => ({ current: initial }));
}

export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T {
  const instance = currentInstance();
  const index = instance.hookIndex;
  const existing = instance.hooks[index];

  if (!existing || existing.kind !== "memo" || !depsEqual(existing.deps, deps)) {
    const value = factory();
    instance.hooks[index] = { kind: "memo", value, deps };
    instance.hookIndex += 1;
    return value;
  }

  instance.hookIndex += 1;
  return existing.value as T;
}

export function useCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  deps: readonly unknown[],
): T {
  return useMemo(() => callback, deps);
}

export function createContext<T>(defaultValue: T): DevContext<T> {
  return Object.freeze({
    id: Symbol("devjs.context"),
    defaultValue,
  });
}

export function useContext<T>(context: DevContext<T>): T {
  return readHook(() => context.defaultValue);
}

export function depsEqual(
  left: readonly unknown[] | undefined,
  right: readonly unknown[] | undefined,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right || left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => Object.is(value, right[index]));
}

export function scheduleRender(instance: ComponentInstance): void {
  const internals = getInternals();
  const root = findRoot(instance);
  queueMicrotask(() => {
    if (internals.rootInstance && root.dom) {
      const { rerenderRoot } = requireClient();
      rerenderRoot();
    }
  });
}

function findRoot(instance: ComponentInstance): ComponentInstance {
  let current = instance;
  while (current.parent) {
    current = current.parent;
  }
  return current;
}

function requireClient(): { rerenderRoot: () => void } {
  return (
    (globalThis as { __devjsClient?: { rerenderRoot: () => void } }).__devjsClient ?? {
      rerenderRoot: () => undefined,
    }
  );
}

export function resetHooks(instance: ComponentInstance): void {
  instance.hookIndex = 0;
  instance.effects = [];
}

export function runEffects(instance: ComponentInstance): void {
  for (const effect of instance.effects) {
    const hook = instance.hooks[effect.index];
    if (!hook || hook.kind !== "effect") {
      continue;
    }
    hook.cleanup?.();
    const cleanup = hook.run?.();
    if (typeof cleanup === "function") {
      hook.cleanup = cleanup;
    }
  }
}

export function renderComponentTree(node: DevNode): DevNode {
  return node;
}
