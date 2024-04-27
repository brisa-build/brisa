import { type IndicatorSignal, type WebContext } from "@/types";

type Effect = ((
  addSubEffect: (effect: Effect) => Effect,
) => unknown | Promise<unknown>) & { id?: Effect };
type Cleanup = () => void | Promise<void>;
type Listener = (...params: any[]) => void;
type State<T> = {
  value: T;
};
type StoreOperation = "get" | "set" | "delete";

const NOTIFY = "n";
const SUBSCRIBE = "s";
const UNSUBSCRIBE = "u";
const INDICATE_PREFIX = "__ind:";
const ORIGINAL_PREFIX = "__o:";

const subscription = createSubscription();
const storeMap = new Map((window as any)._S);
const globalStore = ((window as any)._s = {
  Map: storeMap,
} as Record<string, any>);

// Only get/set/delete from store are reactive
for (let op of ["get", "set", "delete"]) {
  globalStore[op] = (key: string, value: any) => {
    const res = storeMap[op as StoreOperation](key, value);
    subscription[NOTIFY](key, value, op === "get");
    return res;
  };
}

export default function signals() {
  const stack: Effect[] = [];
  const storeSignals = new Map();
  const getSet = <T>(set: Map<unknown, Set<T>>, key: unknown) =>
    set.get(key) ?? new Set();

  let effects = new Map<State<unknown>, Set<Effect>>();
  let cleanups = new Map<Effect, Set<Cleanup>>();
  let subEffectsPerEffect = new Map<Effect, Set<Effect>>();
  let subscribed = false;

  function manageStore(key: string, value: any, getter: boolean) {
    const val = storeSignals.get(key) ?? state(value);
    getter ? val.value : (val.value = value);
    storeSignals.set(key, val);
  }

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

  function state<T>(currentValue?: T): { value: T } {
    let calledSameEffectOnce = false;

    return {
      get value() {
        if (stack[0]) {
          effects.set(this, getSet<Effect>(effects, this).add(stack[0]));
        }
        return currentValue!;
      },
      set value(newValue) {
        // Skip effect if the value is the same. The second condition is to
        // keep store.delete reactive (FIXME: this is a workaround, it should be
        // handled in a different way)
        const skipEffect = newValue === currentValue && newValue != null;

        currentValue = newValue;

        if (skipEffect) return;

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
    // @ts-ignore
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
    manageStoreSubscription(false);
  }

  function manageStoreSubscription(subscribe = true) {
    if (subscribed === subscribe) return;
    subscribed = subscribe;
    subscription[subscribe ? SUBSCRIBE : UNSUBSCRIBE](manageStore);
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

  const store = {
    ...globalStore,
    setOptimistic<T>(actionName: string, key: string, fn: (value: T) => T) {
      const actionKey = INDICATE_PREFIX + actionName;
      const optimisticKey = ORIGINAL_PREFIX + key;
      const originalValue = store.get<T>(key);
      const optimisticValue = fn(originalValue);

      store.set(actionKey, true);
      store.set(optimisticKey, optimisticValue);
      effect(() => {
        if (!store.get(actionKey) && store.get(key) === optimisticValue) {
          store.delete(optimisticKey);
        }
      });
    },
    get(key: string) {
      manageStoreSubscription();
      return globalStore.get(ORIGINAL_PREFIX + key) ?? globalStore.get(key);
    },
  } as WebContext["store"];

  // generate a server action indicator signal
  function indicate(key: string): IndicatorSignal {
    const id = INDICATE_PREFIX + key;
    const indicator = derived(() => !!store.get(id)) as IndicatorSignal;

    indicator.id = id;
    indicator.error = derived(() => store.get("e" + id));

    return indicator;
  }

  return { state, store, effect, reset, cleanup, derived, indicate };
}

function createSubscription() {
  const listeners = new Set<Listener>();

  return {
    [SUBSCRIBE](listener: Listener) {
      listeners.add(listener);
    },
    [NOTIFY](...params: any[]) {
      for (let listener of listeners) listener(...params);
    },
    [UNSUBSCRIBE](listener: Listener) {
      listeners.delete(listener);
    },
  };
}
