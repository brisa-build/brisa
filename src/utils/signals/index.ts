type Fn = () => void | Promise<() => void>;

export default function signals() {
  const cleanups = new Map<Fn, Fn[]>();
  let current: (() => void) | 0 = 0;

  return {
    cleanAll() {
      for (let effect of cleanups.keys()) {
        const cleans = cleanups.get(effect) ?? [];
        for (let clean of cleans) clean();
      }
    },
    state<T>(initialValue: T): { value: T } {
      const effects = new Set<() => void>();
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
    effect(fn: () => void) {
      current = fn;
      fn();
      current = 0;
    },
    cleanup(fn: () => void) {
      const cleans = current ? cleanups.get(current) ?? [] : [];
      cleans.push(fn);
      if (current) cleanups.set(current, cleans);
    },
  };
}
