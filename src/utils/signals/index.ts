type Effect = ((
  addSubEffect: (effect: Effect) => Effect,
) => void | Promise<void>) & { id?: Effect };
type Cleanup = () => void | Promise<void>;
type State<T> = {
  value: T;
};

export default function signals() {
  const stack: Effect[] = [];
  const getSet = <T>(set: Map<unknown, Set<T>>, key: unknown) =>
    set.get(key) ?? new Set();

  let effects = new Map<State<unknown>, Set<Effect>>();
  let cleanups = new Map<Effect, Set<Cleanup>>();
  let subEffectsPerEffect = new Map<Effect, Set<Effect>>();

  function removeFromStack(fn: Effect) {
    const index = stack.indexOf(fn);
    if (index > -1) stack.splice(index, 1);
  }

  function cleanupAnEffect(eff: Effect) {
    const cleans = getSet<Cleanup>(cleanups, eff);
    for (let clean of cleans) clean();
    cleanups.delete(eff);
  }

  function addSubEffect(eff: Effect) {
    const r = (subEffect: Effect) => {
      const subEffects = getSet<Effect>(subEffectsPerEffect, eff);
      subEffects.add(subEffect);
      subEffectsPerEffect.set(eff, subEffects);
      return subEffect;
    };
    r.id = eff;
    return r;
  }

  function cleanSubEffects(fn: Effect) {
    const subEffects = getSet<Effect>(subEffectsPerEffect, fn);

    for (let subEffect of subEffects) {
      // Call cleanups of subeffects + remove them
      cleanupAnEffect(subEffect);

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
    let calledSameEffectOnce = false;

    return {
      get value() {
        if (stack[0]) {
          effects.set(this, getSet<Effect>(effects, this).add(stack[0]));
        }
        return initialValue!;
      },
      set value(v) {
        initialValue = v;

        const currentEffects = getSet<Effect>(effects, this);
        const clonedEffects = new Set<Effect>([...currentEffects]);

        for (let fn of currentEffects) {
          // Avoid calling the same effect infinitely
          if (fn === stack[0]) {
            if (calledSameEffectOnce) continue;
            calledSameEffectOnce = !calledSameEffectOnce;
          }

          // When is not entering means that is a new registered effect, so it is
          // already executed. However is interesting to iterate to the updated
          // effects to don't execute the removed ones (subeffects)
          if (clonedEffects.has(fn)) {
            cleanSubEffects(fn);
            cleanupAnEffect(fn);
            fn(addSubEffect(fn));
          }
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

  function reset() {
    for (let effect of cleanups.keys()) {
      cleanupAnEffect(effect);
    }
    cleanups.clear();
    effects.clear();
    subEffectsPerEffect.clear();
  }

  function cleanup(fn: Cleanup, eff: Effect) {
    const cleans = getSet<Cleanup>(cleanups, eff);
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

  return { state, effect, reset, cleanup, derived };
}
