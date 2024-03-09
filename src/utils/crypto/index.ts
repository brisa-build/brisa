import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const key = Buffer.from(__CRYPTO_KEY__, "hex");
const iv = __CRYPTO_IV__;

export const ENCRYPT_PREFIX = "__encrypted:";
export const ENCRYPT_NONTEXT_PREFIX = "__encrypted-notext:";

export function encrypt(textOrObject: unknown) {
  if (textOrObject == null) return textOrObject;

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let text = textOrObject;
  let prefix = ENCRYPT_PREFIX;

  if (typeof textOrObject !== "string") {
    text = JSON.stringify(textOrObject);
    prefix = ENCRYPT_NONTEXT_PREFIX;
  }

  return (
    prefix + cipher.update(text as string, "utf8", "hex") + cipher.final("hex")
  );
}

export function decrypt(encrypted: string) {
  const isString = encrypted.startsWith(ENCRYPT_PREFIX);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const input = encrypted
    .replace(ENCRYPT_PREFIX, "")
    .replace(ENCRYPT_NONTEXT_PREFIX, "");
  const text = decipher.update(input, "hex", "utf8") + decipher.final("utf8");

  return isString ? text : JSON.parse(text);
}
