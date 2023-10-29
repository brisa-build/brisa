export default function signals() {
  let current: (() => void) | 0 = 0;

  return {
    state<T>(initialValue: T): { value: T } {
      const effects = new Set<() => void>();
      return {
        get value() {
          if (current) effects.add(current);
          return initialValue;
        },
        set value(v) {
          initialValue = v;
          effects.forEach((effect) => effect());
        },
      };
    },
    effect(fn: () => void) {
      current = fn;
      fn();
      current = 0;
    },
  };
}
