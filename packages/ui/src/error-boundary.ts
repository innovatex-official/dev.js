import { h } from "./h.js";
import { useState } from "./hooks.js";
import type { DevComponent, DevNode, DevProps } from "./types.js";

export type ErrorBoundaryProps = Readonly<{
  fallback: (error: Error) => DevNode;
  children?: DevNode;
}>;

export const ErrorBoundary: DevComponent<ErrorBoundaryProps> = ({ fallback, children }) => {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return fallback(error);
  }

  try {
    return children ?? null;
  } catch (caught) {
    const nextError = caught instanceof Error ? caught : new Error(String(caught));
    setError(nextError);
    return fallback(nextError);
  }
};

export function withErrorBoundary<P extends Record<string, unknown>>(
  component: DevComponent<P>,
  fallback: (error: Error) => DevNode,
): DevComponent<P> {
  return (props) =>
    h(ErrorBoundary as DevComponent, { fallback }, h(component as DevComponent, props as DevProps));
}
