type Effect = () => void | Promise<void>;
type Cleanup = Effect;

export default function signals() {
  const stack: Effect[] = [];
  let cleanups = new Map<Effect, Cleanup[]>();

  function removeFromStack(fn: Effect) {
    const index = stack.indexOf(fn);
    if (index > -1) stack.splice(index, 1);
  }

  function cleanEffects(fn: Effect) {
    const cleans = cleanups.get(fn) ?? [];
    for (let clean of cleans) clean();
  }

  function state<T>(initialValue?: T): { value: T } {
    const effects = new Set<Effect>();
    return {
      get value() {
        if (stack[0]) effects.add(stack[0]);
        return initialValue!;
      },
      set value(v) {
        initialValue = v;

        for (let signalEffect of effects) {
          cleanEffects(signalEffect);
          signalEffect();
        }
      },
    };
  }

  async function effect(fn: Effect) {
    stack.unshift(fn);
    const p = fn();
    if (p?.then) await p;
    removeFromStack(fn);
  }

  return {
    state,
    effect,
    cleanAll() {
      for (let effect of cleanups.keys()) {
        cleanEffects(effect);
      }
    },
    cleanup(fn: Cleanup) {
      const cleans = cleanups.get(stack[0]) ?? [];
      cleans.push(fn);
      cleanups.set(stack[0], cleans);
    },
    derived<T>(fn: () => T): { value: T } {
      const derivedState = state<T>();

      effect(() => {
        derivedState.value = fn();
      });

      return derivedState;
    },
  };
}
