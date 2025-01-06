import crypto from 'node:crypto';
import process from 'node:process';

const getAlorithm = () =>
  [
    'aes-256-cbc' as crypto.CipherGCMTypes,
    Buffer.from(
      process.env.__CRYPTO_KEY__ ?? '',
      'hex',
    ) as unknown as crypto.CipherKey,
    process.env.__CRYPTO_IV__ ?? '',
  ] satisfies [crypto.CipherGCMTypes, crypto.CipherKey, string];

export const ENCRYPT_PREFIX = '__encrypted:';
export const ENCRYPT_NONTEXT_PREFIX = '__encrypted-notext:';

export function encrypt(textOrObject: unknown) {
  if (textOrObject == null) return textOrObject;

  const cipher = crypto.createCipheriv(...getAlorithm());
  let text = textOrObject;
  let prefix = ENCRYPT_PREFIX;

  if (typeof textOrObject !== 'string') {
    text = JSON.stringify(textOrObject);
    prefix = ENCRYPT_NONTEXT_PREFIX;
  }

  return (
    prefix + cipher.update(text as string, 'utf8', 'hex') + cipher.final('hex')
  );
}

export function decrypt(encrypted: string) {
  const isString = encrypted.startsWith(ENCRYPT_PREFIX);
  const decipher = crypto.createDecipheriv(...getAlorithm());
  const input = encrypted
    .replace(ENCRYPT_PREFIX, '')
    .replace(ENCRYPT_NONTEXT_PREFIX, '');
  const text = decipher.update(input, 'hex', 'utf8') + decipher.final('utf8');

  return isString ? text : JSON.parse(text);
}
