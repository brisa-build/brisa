type Effect = () => void | Promise<void>;
type Cleanup = Effect;

export default function signals() {
  let cleanups = new Map<Effect, Cleanup[]>();
  let current: Effect | 0 = 0;

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
          if (current) effects.add(current);
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
    effect(fn: Effect) {
      current = fn;
      const p = fn();
      if (p?.then) p.then(() => (current = 0));
      else current = 0;
    },
    cleanup(fn: Cleanup) {
      const cleans = current ? cleanups.get(current) ?? [] : [];
      cleans.push(fn);
      if (current) cleanups.set(current, cleans);
    },
  };
}
