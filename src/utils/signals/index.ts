type Effect = () => void | Promise<void>;
type Cleanup = Effect;

export default function signals() {
  const stack: Effect[] = [];
  let cleanups = new Map<Effect, Cleanup[]>();

  return {
    cleanAll() {
      for (let effect of cleanups.keys()) {
        const cleans = cleanups.get(effect) ?? [];
        for (let clean of cleans) clean();
      }
    },
    state<T>(initialValue: T): { value: T } {
      const effects = new Set<Effect>();
      return {
        get value() {
          if (stack[0]) effects.add(stack[0]);
          return initialValue;
        },
        set value(v) {
          initialValue = v;

          for (let effect of effects) {
            const cleans = cleanups.get(effect) ?? [];
            for (let clean of cleans) clean();
            effect();
          }
        },
      };
    },
    async effect(fn: Effect) {
      stack.unshift(fn);
      const p = fn();
      if (p?.then) await p;
      removeFromStack(fn);
    },
    cleanup(fn: Cleanup) {
      const cleans = cleanups.get(stack[0]) ?? [];
      cleans.push(fn);
      cleanups.set(stack[0], cleans);
    },
  };

  function removeFromStack(fn: Effect) {
    const index = stack.lastIndexOf(fn);
    if (index !== -1) stack.splice(index, 1);
  }
}
