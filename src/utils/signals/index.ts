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
      callCleanupsOfEffect(subEffect);
      cleanups.delete(subEffect);

      for (let signal of effects.keys()) {
        const signalEffects = effects.get(signal)!;
        signalEffects.delete(subEffect);
        if (signalEffects.size === 0) effects.delete(signal);
      }
    }

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

        for (let fn of effects.get(this) ?? []) {
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
