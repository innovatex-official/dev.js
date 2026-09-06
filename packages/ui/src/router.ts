import { h } from "./h.js";
import { useEffect, useState } from "./hooks.js";
import type { DevNode, DevProps } from "./types.js";

export type RouterLocation = Readonly<{
  pathname: string;
  search: string;
  hash: string;
}>;

export type RouterContextValue = Readonly<{
  location: RouterLocation;
  navigate: (to: string) => void;
}>;

let currentRouter: RouterContextValue = Object.freeze({
  location: { pathname: "/", search: "", hash: "" },
  navigate: () => undefined,
});

function readLocation(): RouterLocation {
  const url = new URL(window.location.href);
  return Object.freeze({
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  });
}

export function RouterProvider({ children }: { children?: DevNode }): DevNode {
  const [location, setLocation] = useState<RouterLocation>(readLocation);

  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to: string) => {
    if (to === window.location.pathname) {
      return;
    }
    window.history.pushState({}, "", to);
    setLocation(readLocation());
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  currentRouter = Object.freeze({ location, navigate });
  return children ?? null;
}

export function useRouter(): RouterContextValue {
  return currentRouter;
}

export function Link({
  href,
  children,
  ...props
}: DevProps & { href: string; children?: DevNode }) {
  const { navigate } = useRouter();

  return h(
    "a",
    {
      ...props,
      href,
      onClick: (event: Event) => {
        if (
          event instanceof MouseEvent &&
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          navigate(href);
        }
      },
    },
    children,
  );
}

export function usePathname(): string {
  return useRouter().location.pathname;
}
