import type { DevNode, DevProps } from "./types.js";

declare global {
  namespace JSX {
    type Element = DevNode;
    interface IntrinsicElements {
      [elementName: string]: DevProps;
    }
  }
}

export { Fragment, jsx, jsxDEV, jsxs } from "./h.js";
