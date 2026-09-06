import { h } from "./h.js";
import type { DevComponent, DevNode, DevProps } from "./types.js";

const suspenseComponents = new WeakSet<DevComponent>();

export const Suspense: DevComponent<{ fallback: DevNode; children?: DevNode }> = ({
  fallback: _fallback,
  children,
}) => children ?? null;
suspenseComponents.add(Suspense as DevComponent);

export function isSuspenseComponent(component: DevComponent): boolean {
  return suspenseComponents.has(component);
}

export function isSuspendPromise(value: unknown): value is Promise<unknown> {
  return typeof value === "object" && value !== null && "then" in value;
}

function scheduleSuspendRerender(promise: Promise<unknown>): void {
  promise.then(() => {
    (globalThis as { __devjsClient?: { rerenderRoot: () => void } }).__devjsClient?.rerenderRoot();
  });
}

export function lazy<P extends DevProps>(
  factory: () => Promise<{ default: DevComponent<P> }>,
): DevComponent<P> {
  let status: "pending" | "resolved" | "rejected" = "pending";
  let resolved: DevComponent<P> | null = null;
  let error: Error | null = null;
  let promise: Promise<void> | null = null;

  const Lazy = (props: P): DevNode => {
    if (status === "resolved" && resolved) {
      return h(resolved as DevComponent, props);
    }

    if (status === "rejected" && error) {
      throw error;
    }

    if (!promise) {
      promise = factory()
        .then((module) => {
          resolved = module.default;
          status = "resolved";
        })
        .catch((reason: unknown) => {
          error = reason instanceof Error ? reason : new Error(String(reason));
          status = "rejected";
        });
    }

    throw promise;
  };

  return Lazy as DevComponent<P>;
}

let transitionPending = false;

export function startTransition(callback: () => void): void {
  transitionPending = true;
  callback();
  queueMicrotask(() => {
    transitionPending = false;
    const client = (globalThis as { __devjsClient?: { rerenderRoot: () => void } }).__devjsClient;
    client?.rerenderRoot();
  });
}

export function useTransition(): [boolean, typeof startTransition] {
  return [transitionPending, startTransition];
}

export { scheduleSuspendRerender };
