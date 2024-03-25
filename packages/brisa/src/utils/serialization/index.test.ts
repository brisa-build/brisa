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
  });
});
