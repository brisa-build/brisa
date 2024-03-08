import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const key = Buffer.from(__CRYPTO_KEY__, "hex");
const iv = __CRYPTO_IV__;

export function encrypt(text: string) {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  return cipher.update(text, "utf8", "hex") + cipher.final("hex");
}

export function decrypt(encrypted: string) {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}
