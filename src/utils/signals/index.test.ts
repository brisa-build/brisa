import { describe, expect, it, mock } from "bun:test";
import signals from ".";

describe("signals", () => {
  it("should register effects", () => {
    const { state, effect } = signals();
    const initValue = 0;
    const updatedValue = 435;
    const count = state(initValue);
    const mockEffect = mock<(val: number) => void>(() => {});

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
    const mockEffect = mock<(count: number, username: string) => void>(
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

    const mockEffect = mock<(count: number) => void>(() => {});
    const mockCleanup = mock<() => void>(() => {});

    effect(() => {
      mockEffect(count.value);
      cleanup(mockCleanup);
    });

    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(mockCleanup).toHaveBeenCalledTimes(0);

    count.value = 1;

    expect(mockEffect).toHaveBeenCalledTimes(2);
    expect(mockCleanup).toHaveBeenCalledTimes(1);
  });
});
