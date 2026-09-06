import { resetContextStack } from "./context.js";
import { h } from "./h.js";
import { createInstance, hydrateDom, mount, patch, setEventRoot } from "./reconciler.js";
import { Link, RouterProvider, usePathname, useRouter } from "./router.js";
import {
  type ComponentInstance,
  type DevComponent,
  type DevNode,
  type DevVNode,
  getInternals,
  isVNode,
} from "./types.js";

let rootContainer: HTMLElement | null = null;
let rootVNode: DevVNode | null = null;
let rootInstance: ComponentInstance | null = null;

export function render(vnode: DevNode, container: HTMLElement): void {
  resetContextStack();
  rootContainer = container;
  rootVNode = isVNode(vnode) ? vnode : null;
  setEventRoot(container);
  getInternals().rootInstance = rootInstance;

  if (!rootInstance) {
    rootInstance = rootVNode ? createInstance(rootVNode, null) : null;
    if (rootVNode) {
      rootInstance = patch(container, rootVNode, null, null);
    } else {
      mount(vnode, container, null);
    }
  } else if (rootVNode) {
    rootInstance = patch(container, rootVNode, rootInstance, null);
  }

  getInternals().rootInstance = rootInstance;
  (globalThis as { __devjsClient?: { rerenderRoot: () => void } }).__devjsClient = {
    rerenderRoot,
  };
}

export function rerenderRoot(): void {
  if (!rootContainer || !rootVNode) {
    return;
  }
  rootInstance = patch(rootContainer, rootVNode, rootInstance, null);
  getInternals().rootInstance = rootInstance;
}

export function hydrate(vnode: DevNode, container: HTMLElement): void {
  rootContainer = container;
  rootVNode = isVNode(vnode) ? vnode : null;
  setEventRoot(container);
  container.replaceChildren();
  if (rootVNode) {
    rootInstance = createInstance(rootVNode, null);
    rootInstance.dom = hydrateDom(rootVNode, container, null);
    getInternals().rootInstance = rootInstance;
  }
  (globalThis as { __devjsClient?: { rerenderRoot: () => void } }).__devjsClient = {
    rerenderRoot,
  };
}

export function createRoot(container: HTMLElement) {
  return {
    render: (vnode: DevNode) => render(vnode, container),
    hydrate: (vnode: DevNode) => hydrate(vnode, container),
  };
}

export function mountApp(component: DevComponent, container: HTMLElement): void {
  render(h(component, {}), container);
}

export function hydrateApp(component: DevComponent, container: HTMLElement): void {
  hydrate(h(component, {}), container);
}

export { lazy, Suspense, startTransition, useTransition } from "./suspense.js";
export { Link, RouterProvider, usePathname, useRouter };
