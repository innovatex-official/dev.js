# @devjs/ui

React-alternative UI library for dev.js.

## Features

- `h()` / JSX component model
- Hooks: `useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useContext`
- Server rendering via `renderToString`
- Client rendering and hydration via `@devjs/ui/client`
- Fragment support

## Usage

```ts
import { h, renderToString, useState } from "@devjs/ui";

function Counter() {
  const [count, setCount] = useState(0);
  return h("button", { onClick: () => setCount(count + 1) }, `Count: ${count}`);
}

const html = renderToString(h(Counter, {}));
```

## JSX

Set `jsxImportSource` to `@devjs/ui` in `tsconfig.json`.
