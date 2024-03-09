import { describe, it, expect } from "bun:test";
import { ENCRYPT_NONTEXT_PREFIX, ENCRYPT_PREFIX } from ".";

describe("utils", () => {
  describe("crypto", () => {
    it("should NOT encrypt null", async () => {
      const { encrypt } = await import(".");
      const encryptedNumber = encrypt(null);
      expect(encryptedNumber).toBeNull();
    });

    it("should NOT encrypt undefined", async () => {
      const { encrypt } = await import(".");
      const encryptedNumber = encrypt(undefined);
      expect(encryptedNumber).toBeUndefined();
    });

    it("should encrypt and decrypt a string", async () => {
      const { encrypt, decrypt } = await import(".");
      const text = "Hello World!";
      const encrypted = encrypt(text);
      const decrypted = decrypt(encrypted!);

      expect(encrypted).not.toBe(text);
      expect(encrypted).toStartWith(ENCRYPT_PREFIX);
      expect(decrypted).not.toBe(encrypted);
      expect(decrypted).toBe(text);
    });

    it("should be possible to encrypt and decrypt multiple times without opening/finish the cypher every time", async () => {
      const { encrypt, decrypt } = await import(".");
      const text = "Hello World!";
      const encrypted = encrypt(text);
      const encrypted2 = encrypt(text);
      const decrypted = decrypt(encrypted!);
      const decrypted2 = decrypt(encrypted2!);

      expect(encrypted).not.toBe(text);
      expect(encrypted).toStartWith(ENCRYPT_PREFIX);
      expect(encrypted2).not.toBe(text);
      expect(encrypted2).toStartWith(ENCRYPT_PREFIX);
      expect(decrypted).toBe(text);
      expect(decrypted2).toBe(text);
    });

    it("should be possigle to encrypt an object and decrypt it", async () => {
      const { encrypt, decrypt } = await import(".");
      const obj = { foo: "bar" };
      const encrypted = encrypt(obj);
      const decrypted = decrypt(encrypted!);

      expect(encrypted).not.toEqual(obj);
      expect(encrypted).toStartWith(ENCRYPT_NONTEXT_PREFIX);
      expect(decrypted).toEqual(obj);
    });

    it("should be possible to encrypt and decrypt numbers", async () => {
      const { encrypt, decrypt } = await import(".");

      const encryptedNumber = encrypt(1);
      const decryptedNumber = decrypt(encryptedNumber!);
      expect(encryptedNumber).not.toBe(1);
      expect(encryptedNumber).toStartWith(ENCRYPT_NONTEXT_PREFIX);
      expect(decryptedNumber).toBe(1);
    });

    it("should be possible to encrypt and decrypt boolean", async () => {
      const { encrypt, decrypt } = await import(".");

      const encryptedNumber = encrypt(true);
      const decryptedNumber = decrypt(encryptedNumber!);
      expect(encryptedNumber).not.toBe(true);
      expect(encryptedNumber).toStartWith(ENCRYPT_NONTEXT_PREFIX);
      expect(decryptedNumber).toBe(true);
    });
  });
});
