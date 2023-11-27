type Effect = ((
  addSubEffect: (effect: Effect) => Effect
) => void | Promise<void>) & { id?: Effect };
type Cleanup = () => void | Promise<void>;
type State<T> = {
  value: T;
};

export default function signals() {
  const stack: Effect[] = [];
  let effects = new Map<State<unknown>, Set<Effect>>();
  let cleanups = new Map<Effect, Set<Cleanup>>();
  let subEffectsPerEffect = new Map<Effect, Set<Effect>>();

  function removeFromStack(fn: Effect) {
    const index = stack.indexOf(fn);
    if (index > -1) stack.splice(index, 1);
  }

  function callCleanupsOfEffect(eff: Effect) {
    const cleans = cleanups.get(eff) ?? new Set();
    for (let clean of cleans) clean();
  }

  function addSubEffect(eff: Effect) {
    const r = (subEffect: Effect) => {
      const subEffects = subEffectsPerEffect.get(eff) ?? new Set();
      subEffects.add(subEffect);
      subEffectsPerEffect.set(eff, subEffects);
      return subEffect;
    };
    r.id = eff;
    return r;
  }

  function cleanSubEffects(fn: Effect) {
    const subEffects = subEffectsPerEffect.get(fn) ?? new Set();

    for (let subEffect of subEffects) {
      // Call cleanups of subeffects
      callCleanupsOfEffect(subEffect);
      cleanups.delete(subEffect);

      // Recursive clean subeffects (grandchildren effects)
      cleanSubEffects(subEffect);

      // Remove subeffects registered via signal
      for (let signalEffect of effects.keys()) {
        const signalEffects = effects.get(signalEffect)!;
        signalEffects.delete(subEffect);
        if (signalEffects.size === 0) effects.delete(signalEffect);
      }
    }

    // Remove stored subeffects
    subEffectsPerEffect.delete(fn);
  }

  function state<T>(initialValue?: T): { value: T } {
    return {
      get value() {
        if (stack[0]) {
          effects.set(this, (effects.get(this) ?? new Set()).add(stack[0]));
        }
        return initialValue!;
      },
      set value(v) {
        initialValue = v;

        const originalEffects = effects.get(this) ?? [];
        const clonedEffects = new Set<Effect>([...originalEffects]);

        for (let fn of originalEffects) {
          // This means that is a new registered effect, so it is already executed
          // However is interesting to iterate to the updated effects to don't execute
          // the removed ones (subeffects)
          if (!clonedEffects.has(fn)) continue;

          cleanSubEffects(fn);
          callCleanupsOfEffect(fn);
          fn(addSubEffect(fn));
        }
      },
    };
  }

  async function effect(fn: Effect) {
    stack.unshift(fn);
    const p = fn(addSubEffect(fn));
    if (p?.then) await p;
    removeFromStack(fn);
  }

  function cleanAll() {
    for (let effect of cleanups.keys()) {
      callCleanupsOfEffect(effect);
    }
    cleanups.clear();
    effects.clear();
    subEffectsPerEffect.clear();
  }

  function cleanup(fn: Cleanup, eff: Effect) {
    const cleans = cleanups.get(eff) ?? new Set();
    cleans.add(fn);
    cleanups.set(eff, cleans);
  }

  function derived<T>(fn: () => T): { value: T } {
    const derivedState = state<T>();

    effect(() => {
      derivedState.value = fn();
    });

    return derivedState;
  }

  return { state, effect, cleanAll, cleanup, derived };
}
