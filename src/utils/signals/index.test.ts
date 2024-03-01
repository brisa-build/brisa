import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import type { IndicatorSignal } from "@/types";

let signals: typeof import(".").default;

describe("signals", () => {
  beforeAll(async () => {
    GlobalRegistrator.register();
    (globalThis as any)["_S"] = [["foo", "bar"]];
    signals = await import(".").then((m) => m.default);
  });
  afterAll(() => {
    window._s.Map.clear();
    GlobalRegistrator.unregister();
    delete (globalThis as any)["_S"];
  });

  it('should init the store depending window["_S"] (transferred server store)', () => {
    (window as any)["_S"] = [["foo", "bar"]];
    const { store } = signals();
    expect(store.get<string>("foo")).toBe("bar");
  });

  it("should register effects", () => {
    const { state, effect } = signals();
    const initValue = 0;
    const updatedValue = 435;
    const count = state(initValue);
    const mockEffect = mock<(val?: number) => void>(() => {});

    effect(() => {
      mockEffect(count.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).toBe(initValue);
    count.value = updatedValue;
    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBe(updatedValue);
  });

  it("should an effect update more than one state", () => {
    const { state, effect } = signals();
    const count = state(0);
    const username = state("Anonymous");
    const mockEffect = mock<(count?: number, username?: string) => void>(
      () => {},
    );
    const updatedCount = 435;
    const updatedUsername = "Aral";

    effect(() => {
      mockEffect(count.value, username.value);
    });
    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).toBe(0);
    expect(mockEffect.mock.calls[0][1]).toBe("Anonymous");

    count.value = updatedCount;

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBe(updatedCount);
    expect(mockEffect.mock.calls[1][1]).toBe("Anonymous");

    username.value = updatedUsername;

    expect(mockEffect).toHaveBeenCalledTimes(3);
    expect(mockEffect.mock.calls[2][0]).toBe(updatedCount);
    expect(mockEffect.mock.calls[2][1]).toBe(updatedUsername);
  });

  it("should unregister events registered inside an effect using the cleanup method", () => {
    const { state, effect, cleanup } = signals();
    const count = state(0);

    const mockEffect = mock<(count?: number) => void>(() => {});
    const mockCleanup = mock<() => void>(() => {});

    effect((r: any) => {
      mockEffect(count.value);
      cleanup(mockCleanup, r.id);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockCleanup).toHaveBeenCalledTimes(0);

    count.value = 1;

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });

  it('should be possible to initialize an state with "undefined"', () => {
    const mockEffect = mock<(count: number | undefined) => void>(() => {});
    const { state, effect } = signals();
    const count = state<number | undefined>(undefined);
    expect(count.value).not.toBeDefined();

    effect(() => {
      mockEffect(count.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).not.toBeDefined();

    count.value = 1;

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBe(1);
  });

  it("should work async/await inside an effect", async () => {
    const { state, effect } = signals();
    const count = state(42);
    const mockEffect = mock<(count?: number) => void>(() => {});

    effect(async () => {
      await Promise.resolve();
      mockEffect(count.value);
    });

    await Bun.sleep(0);

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).toBe(42);

    count.value = 1;

    await Bun.sleep(0);

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBe(1);
  });

  it("should work an state inside another state", () => {
    const { state } = signals();
    const age = state<number>(33);
    const name = state<string>("Aral");
    const user = state<any>({ age, name });

    expect(user.value.age.value).toEqual(33);
    expect(user.value.name.value).toEqual("Aral");

    age.value = 35;
    name.value = "Barbara";

    expect(user.value.age.value).toEqual(35);
    expect(user.value.name.value).toEqual("Barbara");
  });

  it("should work with nested effects", () => {
    const { state, effect } = signals();
    const a = state<number>(0);
    const b = state<string>("x");
    const mockEffect = mock<(name: string, value: string | number) => void>(
      () => {},
    );

    effect((r) => {
      effect(
        r(() => {
          mockEffect("B", b.value);
        }),
      );
      mockEffect("A", a.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[0]).toEqual(["B", "x"]);
    expect(mockEffect.mock.calls[1]).toEqual(["A", 0]);

    a.value = 1;
    b.value = "y";

    expect(mockEffect).toHaveBeenCalledTimes(5);
    expect(mockEffect.mock.calls[2]).toEqual(["B", "x"]);
    expect(mockEffect.mock.calls[3]).toEqual(["A", 1]);
    expect(mockEffect.mock.calls[4]).toEqual(["B", "y"]);
  });

  it("should unregister nested conditional effects when the condition is false", () => {
    const { state, effect } = signals();
    const a = state<number>(0);
    const b = state<string>("x");
    const mockEffect = mock<(name: string, value: string | number) => void>(
      () => {},
    );

    effect((r) => {
      if (a.value === 0) {
        effect(
          r(() => {
            mockEffect("B", b.value);
          }),
        );
      }
      mockEffect("A", a.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[0]).toEqual(["B", "x"]);
    expect(mockEffect.mock.calls[1]).toEqual(["A", 0]);

    a.value = 1;
    b.value = "y";

    expect(mockEffect).toHaveBeenCalledTimes(3);
    expect(mockEffect.mock.calls[2]).toEqual(["A", 1]);
  });

  it("should register conditional nested conditional effects when the condition is true", () => {
    const { state, effect } = signals();
    const a = state<number>(0);
    const b = state<string>("x");
    const mockEffect = mock<(name: string, value: string | number) => void>(
      () => {},
    );

    effect((r) => {
      if (a.value === 1) {
        effect(
          r(() => {
            mockEffect("B", b.value);
          }),
        );
      }
      mockEffect("A", a.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0]).toEqual(["A", 0]);

    a.value = 1;

    expect(mockEffect).toHaveBeenCalledTimes(3);
    expect(mockEffect.mock.calls[1]).toEqual(["B", "x"]);
    expect(mockEffect.mock.calls[2]).toEqual(["A", 1]);
  });

  it("should register again nested conditional effects when the condition is true", () => {
    const { state, effect } = signals();
    const a = state<number>(0);
    const b = state<string>("x");
    const mockEffect = mock<(name: string, value: string | number) => void>(
      () => {},
    );

    effect((r) => {
      if (a.value === 0) {
        effect(
          r(() => {
            mockEffect("B", b.value);
          }),
        );
      }
      mockEffect("A", a.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[0]).toEqual(["B", "x"]);
    expect(mockEffect.mock.calls[1]).toEqual(["A", 0]);

    a.value = 1;
    b.value = "y";

    expect(mockEffect).toHaveBeenCalledTimes(3);
    expect(mockEffect.mock.calls[2]).toEqual(["A", 1]);

    a.value = 0;
    b.value = "z";

    expect(mockEffect).toHaveBeenCalledTimes(6);
    expect(mockEffect.mock.calls[3]).toEqual(["B", "y"]);
    expect(mockEffect.mock.calls[4]).toEqual(["A", 0]);
    expect(mockEffect.mock.calls[5]).toEqual(["B", "z"]);
  });

  it("should work without race conditions between async effects and signals", async () => {
    const { state, effect } = signals();
    const count = state<number>(0);
    const delay = Promise.resolve();
    let lastSeen = -1;

    effect(async () => {
      await delay;
      lastSeen = count.value!;
    });

    effect(() => {});

    await delay;
    expect(lastSeen).toBe(0);
    count.value = 1;
    await delay;
    expect(lastSeen).toBe(1);
  });

  it('should work with "derived" method', () => {
    const { state, derived } = signals();
    const count = state<number>(0);
    const double = derived<number>(() => count.value * 2);

    expect(double.value).toBe(0);

    count.value = 1;

    expect(double.value).toBe(2);
  });

  it("should work a derived state inside another derived state", () => {
    const { state, derived } = signals();
    const count = state<number>(0);
    const double = derived<number>(() => count.value * 2);
    const triple = derived<number>(() => double.value * 3);

    expect(triple.value).toBe(0);

    count.value = 1;

    expect(triple.value).toBe(6);
  });

  it('should remove all effects with "reset" method', () => {
    const { state, effect, reset } = signals();
    const count = state<number>(0);
    const mockEffect = mock<(count?: number) => void>(() => {});

    effect(() => {
      mockEffect(count.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);

    count.value = 1;

    expect(mockEffect).toHaveBeenCalledTimes(2);

    reset();

    count.value = 2;

    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should remove all cleanups with "reset" method', () => {
    const { state, effect, cleanup, reset } = signals();
    const count = state<number>(0);
    const mockEffect = mock<(count?: number) => void>(() => {});
    const mockCleanup = mock<() => void>(() => {});

    effect((r: any) => {
      mockEffect(count.value);
      cleanup(mockCleanup, r.id);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockCleanup).toHaveBeenCalledTimes(0);

    count.value = 1;

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockCleanup).toHaveBeenCalledTimes(1);

    reset();

    expect(mockCleanup).toHaveBeenCalledTimes(2);

    count.value = 2;

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockCleanup).toHaveBeenCalledTimes(2);
  });

  it("should work store shared between different signals", () => {
    const { store, effect } = signals();
    const { store: store2 } = signals();

    const mockEffect = mock<(count?: number) => void>(() => {});
    store.set("count", 0);

    expect(store.get<number>("count")).toBe(0);

    effect(() => {
      mockEffect(store.get("count"));
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).toBe(0);

    store.set("count", 2);

    expect(store.get<number>("count")).toBe(2);
    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBe(2);

    store2.set("count", 1);

    expect(store2.get<number>("count")).toBe(1);
    expect(store.get<number>("count")).toBe(1);
    expect(mockEffect).toHaveBeenCalledTimes(3);
    expect(mockEffect.mock.calls[2][0]).toBe(1);
    expect([...store.Map.entries()]).toEqual([
      ["foo", "bar"],
      ["count", 1],
    ]);

    store.Map.clear();
  });

  it('should expose store to window["_s"] to allow RPC to modify it', () => {
    const { store } = signals();
    store.set("count", 0);
    expect((window as any)._s.get("count")).toBe(0);
  });

  it("should work store with derived", () => {
    const { store, derived, effect } = signals();
    const { store: store2 } = signals();
    const mockEffect = mock<(count?: number) => void>(() => {});

    store.set("count", 0);
    const double = derived<number>(() => store.get<number>("count") * 2);

    expect(double.value).toBe(0);

    store.set("count", 1);

    expect(double.value).toBe(2);

    effect(() => {
      mockEffect(double.value);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).toBe(2);

    store.set("count", 2);

    expect(double.value).toBe(4);
    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBe(4);

    store2.set("count", 1);

    expect(store2.get<number>("count")).toBe(1);
    expect(store.get<number>("count")).toBe(1);
    expect(double.value).toBe(2);
    expect(mockEffect).toHaveBeenCalledTimes(3);
    expect(mockEffect.mock.calls[2][0]).toBe(2);

    store.Map.clear();
  });

  it("should work reactive store delete method", () => {
    const { store, effect } = signals();
    const mockEffect = mock<(count?: number) => void>(() => {});

    store.set("count", 0);

    expect(store.get<number>("count")).toBe(0);

    effect(() => {
      mockEffect(store.get("count"));
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockEffect.mock.calls[0][0]).toBe(0);

    store.delete("count");

    expect(store.get("count")).toBeUndefined();
    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[1][0]).toBeUndefined();
    store.Map.clear();
  });

  it('should work the "indicate" method', () => {
    const { indicate, store, effect } = signals();
    const mockEffect = mock<(isPending: boolean) => void>(() => {});
    const actionPending = indicate("increment");

    effect(() => {
      mockEffect(actionPending.value);
    });

    store.set(actionPending.id, true);

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[0][0]).toBeFalse();
    expect(mockEffect.mock.calls[1][0]).toBeTrue();
  });

  it('should work the error in "indicate" method', () => {
    const { indicate, store, effect } = signals();
    const mockEffect = mock<(error: IndicatorSignal["error"]["value"]) => void>(
      () => {},
    );
    const indicator = indicate("increment");

    effect(() => {
      mockEffect(indicator.error.value);
    });

    store.set("e" + indicator.id, [new Response(), new Error("Some error")]);

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockEffect.mock.calls[0][0]).toBeUndefined();
    expect(mockEffect.mock.calls[1][0]).toEqual([
      new Response(),
      new Error("Some error"),
    ]);
  });

  it('should "store.setOptimistic" reset the value if the store is not updated in the server action', () => {
    const { store } = signals();

    store.set("count", 0);
    store.setOptimistic<number>("increment", "count", (v) => v + 1);

    expect(store.get<number>("count")).toBe(1);

    // Simulate RPC to turn off optimistic update
    window._s.set("__ind:increment", false);

    expect(store.get<number>("count")).toBe(0);
  });

  it('should "store.setOptimistic" keep the value if the store is updated in the server action', () => {
    const { store } = signals();

    store.set("count", 0);
    store.setOptimistic<number>("increment", "count", (v) => v + 1);

    expect(store.get<number>("count")).toBe(1);

    // Simulate RPC to update store + turn off optimistic update
    window._s.set("count", 1234);
    window._s.set("__ind:increment", false);

    expect(store.get<number>("count")).toBe(1234);
  });

  it('should "store.setOptimistic" work with objects', () => {
    const { store } = signals();

    type User = { name: string };

    store.set<User>("user", { name: "Aral" });
    store.setOptimistic<{ name: string }>("updateName", "user", (v) => ({
      ...v,
      name: "Barbara",
    }));

    expect(store.get<User>("user")).toEqual({ name: "Barbara" });

    // Simulate RPC to turn off optimistic update
    window._s.set("__ind:updateName", false);

    expect(store.get<User>("user")).toEqual({ name: "Aral" });
  });
});
