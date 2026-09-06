import { renderToString } from "./ssr.js";
import type { DevNode } from "./types.js";

export { Children, cloneElement, createElement, Fragment, h, jsx, jsxDEV, jsxs } from "./h.js";
export { ErrorBoundary, withErrorBoundary } from "./error-boundary.js";
export {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "./hooks.js";
export { createApp, escapeHtml, renderToString } from "./ssr.js";
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
