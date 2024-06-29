import { describe, expect, it } from "bun:test";
import { deserialize, serialize } from ".";

describe("utils", () => {
  describe("serialization: serialize + deserialize", () => {
    it("should not transform an string", () => {
      const serialized = serialize("hello");
      expect(serialized).toBe("hello");

      const deserialized = deserialize(serialized);
      expect(deserialized).toBe("hello");
    });

    it("should transform an object", () => {
      const serialized = serialize({ foo: "bar" });
      expect(serialized).toBe("{'foo':'bar'}");

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual({ foo: "bar" });
    });

    it("should transform an array", () => {
      const serialized = serialize([1, 2, 3]);
      expect(serialized).toBe("[1,2,3]");

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual([1, 2, 3]);
    });

    it("should transform an nested object", () => {
      const serialized = serialize({ foo: { bar: "baz" } });
      expect(serialized).toBe("{'foo':{'bar':'baz'}}");

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual({ foo: { bar: "baz" } });
    });

    it('should transform an object without replacing the " character inside the string', () => {
      const serialized = serialize({ foo: 'bar"baz' });
      expect(serialized).toBe(`{'foo':'bar\\'baz"}`);

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual({ foo: 'bar"baz' });
    });

    it('should transform an object without replacing multiple " character inside the string', () => {
      const serialized = serialize({ foo: 'bar"""baz' });
      expect(serialized).toBe(`{'foo':'bar\\'\\'\\'baz"}`);

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual({ foo: 'bar"""baz' });
    });

    it("should serialize and deserialize entries with empty strings as value", () => {
      const map = new Map<string, string>();
      map.set("foo", "");
      map.set("bar", "");
      const entries = [...map];

      const serialized = serialize(entries);
      expect(serialized).toBe("[['foo',''],['bar','']]");

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(entries);
    });

    it("should serialize and deserialize entries with null as value", () => {
      const map = new Map<string, null>();
      map.set("foo", null);
      map.set("bar", null);
      const entries = [...map];

      const serialized = serialize(entries);
      expect(serialized).toBe("[['foo',null],['bar',null]]");

      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(entries);
    });

    // For now is converted to "null" by JSON.stringify, it would be nice to fix
    // this case: https://github.com/brisa-build/brisa/issues/279
    it.todo(
      "should serialize and deserialize entries with undefined as value",
      () => {
        const map = new Map<string, undefined>();
        map.set("foo", undefined);
        map.set("bar", undefined);
        const entries = [...map];

        const serialized = serialize(entries);
        expect(serialized).toBe("[['foo'],['bar']]");

        const deserialized = deserialize(serialized);
        expect(deserialized).toEqual(entries);
      },
    );
  });
});
