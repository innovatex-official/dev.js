import type { DevComponent } from "@devjs/ui";
import { useState } from "@devjs/ui";

export const Counter: DevComponent<{ initial?: number }> = ({ initial = 0 }) => {
  const [count, setCount] = useState(initial);

  return (
    <button type="button" className="counter-button" onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
};
