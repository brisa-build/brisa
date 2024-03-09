import crypto from "node:crypto";

globalThis.__CRYPTO_KEY__ = crypto.randomBytes(32).toString("hex");
globalThis.__CRYPTO_IV__ = crypto.randomBytes(8).toString("hex");
