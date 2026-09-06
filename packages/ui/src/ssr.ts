import { h } from "./h.js";
import { resetHooks } from "./hooks.js";
import {
  type ComponentInstance,
  type DevComponent,
  type DevNode,
  type DevVNode,
  Fragment,
  flattenChildren,
  getInternals,
  isComponent,
  isVNode,
} from "./types.js";

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const BOOLEAN_ATTRIBUTES = new Set([
  "checked",
  "selected",
  "disabled",
  "readonly",
  "multiple",
  "required",
  "autofocus",
]);

export function renderToString(node: DevNode): string {
  return renderNode(node);
}

function renderNode(node: DevNode): string {
  if (node === null || node === undefined || node === false) {
    return "";
  }

  if (typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return escapeHtml(String(node));
  }

  if (Array.isArray(node)) {
    return node.map((child) => renderNode(child)).join("");
  }

  if (!isVNode(node)) {
    return "";
  }

  if (node.type === Fragment) {
    return renderChildren(node.props.children as DevNode);
  }

  if (isComponent(node.type)) {
    return renderComponent(node.type, node.props, null);
  }

  const tag = node.type;
  const props = node.props;
  const children = renderChildren(props.children as DevNode);
  const attrs = renderAttributes(tag, props);

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs}>`;
  }

  return `<${tag}${attrs}>${children}</${tag}>`;
}

function renderComponent(
  component: DevComponent,
  props: DevVNode["props"],
  parent: ComponentInstance | null,
): string {
  const instance: ComponentInstance = {
    hooks: parent ? [] : [],
    hookIndex: 0,
    effects: [],
    vnode: null,
    dom: null,
    childInstances: [],
    parent,
  };

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

  return renderNode(rendered);
}

function renderChildren(children: DevNode): string {
  return flattenChildren(children)
    .map((child) => renderNode(child))
    .join("");
}

function renderAttributes(tag: string, props: DevVNode["props"]): string {
  const parts: string[] = [];

  for (const [name, value] of Object.entries(props)) {
    if (name === "children" || name === "key" || name === "ref") {
      continue;
    }

    if (name.startsWith("on") && typeof value === "function") {
      continue;
    }

    if (value === false || value === null || value === undefined) {
      continue;
    }

    const attributeName = name === "className" ? "class" : name === "htmlFor" ? "for" : name;

    if (BOOLEAN_ATTRIBUTES.has(attributeName) && value === true) {
      parts.push(attributeName);
      continue;
    }

    if (attributeName === "style" && typeof value === "object" && value !== null) {
      const style = Object.entries(value as Record<string, string | number>)
        .map(([key, cssValue]) => `${camelToKebab(key)}:${cssValue}`)
        .join(";");
      parts.push(`style="${escapeAttribute(style)}"`);
      continue;
    }

    parts.push(`${attributeName}="${escapeAttribute(String(value))}"`);
  }

  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

export function createApp(component: DevComponent) {
  return {
    renderToString: () => renderToString(h(component, {})),
    component,
  };
}
