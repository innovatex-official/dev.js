import {
  type DevComponent,
  type DevNode,
  type DevProps,
  type DevVNode,
  Fragment,
  flattenChildren,
} from "./types.js";

export { Fragment };

export function h(
  type: string | DevComponent | typeof Fragment,
  props: DevProps | null,
  ...children: DevNode[]
): DevVNode {
  const normalizedProps: Record<string, unknown> = props ? { ...props } : {};

  if (children.length > 0) {
    normalizedProps.children = children.length === 1 ? children[0] : children;
  }

  const key = normalizedProps.key;
  if (key !== undefined && key !== null) {
    delete normalizedProps.key;
  }

  return Object.freeze({
    type,
    props: normalizedProps as DevProps,
    key: typeof key === "string" || typeof key === "number" ? key : null,
  });
}

export const createElement = h;

export function jsx(type: string | DevComponent | typeof Fragment, props: DevProps): DevVNode {
  const { children, ...rest } = props;
  return h(type, rest, ...(children === undefined ? [] : flattenChildren(children as DevNode)));
}

export function jsxs(type: string | DevComponent | typeof Fragment, props: DevProps): DevVNode {
  return jsx(type, props);
}

export function jsxDEV(type: string | DevComponent | typeof Fragment, props: DevProps): DevVNode {
  return jsx(type, props);
}

export function cloneElement(vnode: DevVNode, props: DevProps, ...children: DevNode[]): DevVNode {
  const mergedProps = { ...vnode.props, ...props };
  if (children.length > 0) {
    mergedProps.children = children.length === 1 ? children[0] : children;
  }
  return h(vnode.type, mergedProps);
}

export function Children(map: (child: DevNode, index: number) => DevNode) {
  return (props: DevProps): DevNode[] => {
    const children = flattenChildren(props.children as DevNode);
    return children.map((child, index) => map(child, index));
  };
}
