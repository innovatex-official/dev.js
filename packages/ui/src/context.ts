import type { DevComponent, DevContext, DevNode } from "./types.js";
import { getInternals } from "./types.js";

export type ContextValue<T> = DevContext<T> & {
  Provider: DevComponent<{ value: T; children?: DevNode }>;
};

const providerComponents = new WeakSet<DevComponent>();

export function createContext<T>(defaultValue: T): ContextValue<T> {
  const id = Symbol("devjs.context");

  const Provider: DevComponent<{ value: T; children?: DevNode }> = ({ value, children }) => {
    enterContext(id, value);
    return children ?? null;
  };
  providerComponents.add(Provider as DevComponent);

  return Object.freeze({
    id,
    defaultValue,
    Provider,
  });
}

export function isContextProvider(component: DevComponent): boolean {
  return providerComponents.has(component);
}

export function enterContext(id: symbol, value: unknown): void {
  const internals = getInternals();
  const parent = internals.contextStack.at(-1) ?? new Map<symbol, unknown>();
  const next = new Map(parent);
  next.set(id, value);
  internals.contextStack.push(next);
}

export function leaveContext(): void {
  const internals = getInternals();
  if (internals.contextStack.length > 1) {
    internals.contextStack.pop();
  }
}

export function readContextValue<T>(context: DevContext<T>): T {
  const map = getInternals().contextStack.at(-1);
  if (map?.has(context.id)) {
    return map.get(context.id) as T;
  }
  return context.defaultValue;
}

export function resetContextStack(): void {
  getInternals().contextStack = [new Map()];
}
