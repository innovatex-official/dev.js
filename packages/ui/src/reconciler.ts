import { h } from "./h.js";
import { resetHooks, runEffects } from "./hooks.js";
import {
  type ComponentInstance,
  type DevComponent,
  type DevNode,
  type DevVNode,
  type EventHandler,
  Fragment,
  flattenChildren,
  getInternals,
  isComponent,
  isVNode,
} from "./types.js";

let eventRoot: HTMLElement | null = null;
const delegatedEvents = new Map<string, Set<EventHandler>>();

export function setEventRoot(root: HTMLElement): void {
  eventRoot = root;
}

export function createInstance(
  vnode: DevVNode,
  parent: ComponentInstance | null,
): ComponentInstance {
  return {
    hooks: [],
    hookIndex: 0,
    effects: [],
    vnode,
    dom: null,
    childInstances: [],
    parent,
  };
}

export function mount(
  vnode: DevNode,
  container: HTMLElement,
  parent: ComponentInstance | null,
): Node | null {
  if (vnode === null || vnode === undefined || vnode === false || vnode === true) {
    return null;
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    const text = document.createTextNode(String(vnode));
    container.appendChild(text);
    return text;
  }

  if (Array.isArray(vnode)) {
    const fragment = document.createDocumentFragment();
    for (const child of vnode) {
      const node = mount(child, container, parent);
      if (node) {
        fragment.appendChild(node);
      }
    }
    container.appendChild(fragment);
    return fragment;
  }

  if (!isVNode(vnode)) {
    return null;
  }

  if (vnode.type === Fragment) {
    const fragment = document.createDocumentFragment();
    for (const child of flattenChildren(vnode.props.children as DevNode)) {
      const node = mount(child, container, parent);
      if (node) {
        fragment.appendChild(node);
      }
    }
    container.appendChild(fragment);
    return fragment;
  }

  if (isComponent(vnode.type)) {
    const instance = createInstance(vnode, parent);
    return mountComponent(instance, vnode.type, vnode.props, container);
  }

  const element = document.createElement(vnode.type);
  applyProps(element, vnode.props, false);
  const children = flattenChildren(vnode.props.children as DevNode);
  for (const child of children) {
    mount(child, element, parent);
  }
  container.appendChild(element);
  return element;
}

function mountComponent(
  instance: ComponentInstance,
  component: DevComponent,
  props: DevVNode["props"],
  container: HTMLElement,
): Node | null {
  const internals = getInternals();
  const previous = internals.currentInstance;
  internals.currentInstance = instance;
  resetHooks(instance);

  let rendered: DevNode;
  try {
    rendered = component(props);
  } finally {
    internals.currentInstance = previous;
  }

  instance.dom = mount(rendered, container, instance);
  flushEffects(instance);
  return instance.dom;
}

export function patch(
  container: HTMLElement,
  newVNode: DevNode,
  oldInstance: ComponentInstance | null,
  parent: ComponentInstance | null,
): ComponentInstance | null {
  if (newVNode === null || newVNode === undefined || newVNode === false || newVNode === true) {
    if (oldInstance?.dom) {
      oldInstance.dom.parentNode?.removeChild(oldInstance.dom);
    }
    return null;
  }

  if (typeof newVNode === "string" || typeof newVNode === "number") {
    if (oldInstance?.dom && oldInstance.dom.nodeType === Node.TEXT_NODE) {
      if (oldInstance.dom.textContent !== String(newVNode)) {
        oldInstance.dom.textContent = String(newVNode);
      }
      return oldInstance;
    }
    if (oldInstance?.dom) {
      oldInstance.dom.parentNode?.replaceChild(
        document.createTextNode(String(newVNode)),
        oldInstance.dom,
      );
    } else {
      container.appendChild(document.createTextNode(String(newVNode)));
    }
    return createTextInstance(newVNode, parent);
  }

  if (Array.isArray(newVNode)) {
    const fragment = document.createDocumentFragment();
    for (const child of newVNode) {
      mount(child, container, parent);
      fragment.appendChild(container.lastChild as Node);
    }
    return createInstance(h(Fragment, { children: newVNode }), parent);
  }

  if (!isVNode(newVNode)) {
    return null;
  }

  if (newVNode.type === Fragment) {
    for (const child of flattenChildren(newVNode.props.children as DevNode)) {
      mount(child, container, parent);
    }
    return createInstance(newVNode, parent);
  }

  if (isComponent(newVNode.type)) {
    if (
      oldInstance &&
      oldInstance.vnode &&
      isVNode(oldInstance.vnode) &&
      oldInstance.vnode.type === newVNode.type
    ) {
      return updateComponent(oldInstance, newVNode.props);
    }
    if (oldInstance?.dom) {
      oldInstance.dom.parentNode?.removeChild(oldInstance.dom);
    }
    const instance = createInstance(newVNode, parent);
    instance.dom = mountComponent(instance, newVNode.type, newVNode.props, container);
    return instance;
  }

  if (oldInstance?.dom && oldInstance.dom.nodeName.toLowerCase() === newVNode.type) {
    const element = oldInstance.dom as HTMLElement;
    applyProps(element, newVNode.props, true);
    updateChildren(
      element,
      flattenChildren(newVNode.props.children as DevNode),
      oldInstance.childInstances,
      oldInstance,
    );
    oldInstance.vnode = newVNode;
    return oldInstance;
  }

  if (oldInstance?.dom) {
    const element = document.createElement(newVNode.type);
    applyProps(element, newVNode.props, false);
    updateChildren(
      element,
      flattenChildren(newVNode.props.children as DevNode),
      oldInstance.childInstances,
      oldInstance,
    );
    oldInstance.dom.parentNode?.replaceChild(element, oldInstance.dom);
    const instance = createInstance(newVNode, parent);
    instance.dom = element;
    return instance;
  }

  const instance = createInstance(newVNode, parent);
  instance.dom = mount(newVNode, container, parent);
  return instance;
}

function updateComponent(instance: ComponentInstance, props: DevVNode["props"]): ComponentInstance {
  const internals = getInternals();
  const previous = internals.currentInstance;
  internals.currentInstance = instance;
  resetHooks(instance);

  const component = (instance.vnode as DevVNode).type as DevComponent;
  let rendered: DevNode;
  try {
    rendered = component(props);
  } finally {
    internals.currentInstance = previous;
  }

  if (instance.dom && instance.dom.parentNode) {
    const parentElement = instance.dom.parentNode as HTMLElement;
    const newDom = patch(parentElement, rendered, instance.childInstances[0] ?? null, instance);
    if (newDom?.dom) {
      instance.dom = newDom.dom;
    }
  }

  flushEffects(instance);
  return instance;
}

function updateChildren(
  parentElement: HTMLElement,
  children: DevNode[],
  oldInstances: ComponentInstance[],
  parent: ComponentInstance,
): void {
  const used: ComponentInstance[] = [];

  children.forEach((child, index) => {
    const oldInstance = oldInstances[index] ?? null;
    const nextInstance = patch(parentElement, child, oldInstance, parent);
    if (nextInstance) {
      used.push(nextInstance);
    }
  });

  for (let index = children.length; index < oldInstances.length; index += 1) {
    const stale = oldInstances[index];
    stale?.dom?.parentNode?.removeChild(stale.dom);
  }

  parent.childInstances = used;
}

function createTextInstance(
  value: string | number,
  parent: ComponentInstance | null,
): ComponentInstance {
  const instance = createInstance(h("span", {}), parent);
  instance.dom = document.createTextNode(String(value));
  return instance;
}

function applyProps(element: HTMLElement, props: DevVNode["props"], isUpdate: boolean): void {
  for (const [name, value] of Object.entries(props)) {
    if (name === "children" || name === "key") {
      continue;
    }

    if (name === "ref" && value && typeof value === "object" && "current" in (value as object)) {
      (value as { current: HTMLElement | null }).current = element;
      continue;
    }

    if (name.startsWith("on") && typeof value === "function") {
      const eventName = name.slice(2).toLowerCase();
      registerDelegatedEvent(eventName, value as EventHandler);
      element.dataset[`devjs${eventName}`] = "1";
      continue;
    }

    if (name === "className") {
      element.setAttribute("class", String(value ?? ""));
      continue;
    }

    if (name === "style" && typeof value === "object" && value !== null) {
      Object.assign(element.style, value as Record<string, string>);
      continue;
    }

    if (value === false || value === null || value === undefined) {
      if (isUpdate) {
        element.removeAttribute(name);
      }
      continue;
    }

    if (
      name === "value" &&
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
    ) {
      element.value = String(value);
      continue;
    }

    if (name === "checked" && element instanceof HTMLInputElement) {
      element.checked = Boolean(value);
      continue;
    }

    element.setAttribute(name, String(value));
  }
}

function registerDelegatedEvent(eventName: string, handler: EventHandler): void {
  if (!eventRoot) {
    return;
  }

  if (!delegatedEvents.has(eventName)) {
    const handlers = new Set<EventHandler>();
    delegatedEvents.set(eventName, handlers);
    eventRoot.addEventListener(eventName, (event: Event) => {
      let target = event.target as HTMLElement | null;
      while (target && target !== eventRoot) {
        if (target.dataset[`devjs${eventName}`] === "1") {
          for (const listener of handlers) {
            listener(event);
          }
          break;
        }
        target = target.parentElement;
      }
    });
  }

  delegatedEvents.get(eventName)?.add(handler);
}

function flushEffects(instance: ComponentInstance): void {
  runEffects(instance);
}

export function hydrateDom(
  vnode: DevNode,
  container: HTMLElement,
  parent: ComponentInstance | null,
): Node | null {
  getInternals().isHydrating = true;
  const node = mount(vnode, container, parent);
  getInternals().isHydrating = false;
  return node;
}
