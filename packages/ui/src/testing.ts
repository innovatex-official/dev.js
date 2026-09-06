import { renderToString } from "./ssr.js";
import type { DevComponent, DevNode, DevProps } from "./types.js";
import { h } from "./h.js";

export function render(component: DevComponent<DevProps>, props: DevProps = {}): string {
  return renderToString(h(component, props));
}

export function screen(content: string): { getByText: (text: string) => boolean } {
  return {
    getByText: (text: string) => content.includes(text),
  };
}

export type RenderResult = Readonly<{
  html: string;
  container: { innerHTML: string };
}>;

export function renderComponent(
  component: DevComponent<DevProps>,
  props: DevProps = {},
): RenderResult {
  const html = render(component, props);
  return Object.freeze({
    html,
    container: Object.freeze({ innerHTML: html }),
  });
}

export function cleanup(): void {
  // Server renderer is stateless today.
}
