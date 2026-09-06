import { renderToString } from "./ssr.js";
import type { DevNode } from "./types.js";

export { type ContextValue, createContext } from "./context.js";
export { ErrorBoundary, withErrorBoundary } from "./error-boundary.js";
export { Children, cloneElement, createElement, Fragment, h, jsx, jsxDEV, jsxs } from "./h.js";
export {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "./hooks.js";
export { createApp, escapeHtml, renderToString } from "./ssr.js";
export { lazy, Suspense, startTransition, useTransition } from "./suspense.js";
export type {
  DevComponent,
  DevContext,
  DevNode,
  DevProps,
  DevVNode,
  EffectCallback,
  EffectCleanup,
} from "./types.js";

export function resolveRenderOutput(value: string | DevNode): string {
  if (typeof value === "string") {
    return value;
  }
  return renderToString(value);
}
