import crypto from "node:crypto";

Bun.env.__CRYPTO_KEY__ = crypto.randomBytes(32).toString("hex");
Bun.env.__CRYPTO_IV__ = crypto.randomBytes(8).toString("hex");
