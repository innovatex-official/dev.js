export type DevProps = Readonly<Record<string, unknown>>;

export type DevComponent<P extends DevProps = DevProps> = (props: P) => DevNode;

export type DevNode = string | number | boolean | null | undefined | DevVNode | readonly DevNode[];

export type DevVNode = Readonly<{
  type: string | DevComponent | typeof Fragment;
  props: DevProps;
  key: string | number | null;
}>;

export const Fragment: unique symbol = Symbol.for("devjs.fragment");

export type DevContext<T> = Readonly<{
  id: symbol;
  defaultValue: T;
}>;

export type EffectCleanup = () => void;
export type EffectCallback = () => EffectCleanup | void;

export type HookState =
  | { kind: "state"; value: unknown }
  | {
      kind: "effect";
      deps: readonly unknown[] | undefined;
      cleanup?: EffectCleanup;
      run?: EffectCallback;
    }
  | { kind: "ref"; value: { current: unknown } }
  | { kind: "memo"; value: unknown; deps: readonly unknown[] }
  | { kind: "callback"; value: unknown; deps: readonly unknown[] }
  | { kind: "context"; value: unknown };

export type ComponentInstance = {
  hooks: HookState[];
  hookIndex: number;
  effects: Array<{ index: number; deps: readonly unknown[] | undefined }>;
  vnode: DevVNode | null;
  dom: Node | null;
  childInstances: ComponentInstance[];
  parent: ComponentInstance | null;
};

export type EventHandler = (event: Event) => void;

export const DEV_INTERNALS = Symbol.for("devjs.internals");

export type DevInternals = {
  currentInstance: ComponentInstance | null;
  rootInstance: ComponentInstance | null;
  pendingEffects: ComponentInstance[];
  isHydrating: boolean;
  contextStack: Map<symbol, unknown>[];
  transitionPending: boolean;
};

export function getInternals(): DevInternals {
  const globalScope = globalThis as Record<PropertyKey, unknown>;
  if (!globalScope[DEV_INTERNALS]) {
    globalScope[DEV_INTERNALS] = {
      currentInstance: null,
      rootInstance: null,
      pendingEffects: [],
      isHydrating: false,
      contextStack: [new Map()],
      transitionPending: false,
    } satisfies DevInternals;
  }
  return globalScope[DEV_INTERNALS] as DevInternals;
}

export function isVNode(node: DevNode): node is DevVNode {
  return typeof node === "object" && node !== null && !Array.isArray(node) && "type" in node;
}

export function isComponent(type: DevVNode["type"]): type is DevComponent {
  return typeof type === "function";
}

export function flattenChildren(children: DevNode): DevNode[] {
  const result: DevNode[] = [];

  const visit = (child: DevNode): void => {
    if (child === null || child === undefined || child === false) {
      return;
    }

    if (Array.isArray(child)) {
      for (const nested of child) {
        visit(nested);
      }
      return;
    }

    result.push(child);
  };

  visit(children);
  return result;
}
