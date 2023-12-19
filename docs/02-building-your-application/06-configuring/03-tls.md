---
title: TLS
description: Learn how to configure TLS
---

Brisa supports TLS out of the box thanks to [Bun](https://bun.sh/docs/api/http#tls), powered by [BoringSSL](https://boringssl.googlesource.com/boringssl). Enable TLS by passing in a value for `key` and `cert`; both are required to enable TLS.

**brisa.config.ts**:

```ts
import { Configuration } from "brisa";

const config: Configuration = {
  tls: {
    key: Bun.file("./key.pem"),
    cert: Bun.file("./cert.pem"),
  }
};

export default config;
```

The `key` and `cert` fields expect the contents of your TLS key and certificate, not a path to it. This can be a string, BunFile, TypedArray, or Buffer.

**brisa.config.ts**:

```ts
import { Configuration } from "brisa";

const config: Configuration = {
  tls: {
    // BunFile
    key: Bun.file("./key.pem"),
    // Buffer
    key: fs.readFileSync("./key.pem"),
    // string
    key: fs.readFileSync("./key.pem", "utf8"),
    // array of above
    key: [Bun.file("./key1.pem"), Bun.file("./key2.pem")],
  }
};

export default config;
```

If your private key is encrypted with a passphrase, provide a value for `passphrase` to decrypt it.

**brisa.config.ts**:

```ts
import { Configuration } from "brisa";

const config: Configuration = {
  tls: {
    key: Bun.file("./key.pem"),
    cert: Bun.file("./cert.pem"),
    passphrase: "my-secret-passphrase",
  }
};

export default config;
```

Optionally, you can override the trusted CA certificates by passing a value for `ca`. By default, the server will trust the list of well-known CAs curated by Mozilla. When `ca` is specified, the Mozilla list is overwritten.

**brisa.config.ts**:

```ts
import { Configuration } from "brisa";

const config: Configuration = {
  tls: {
    key: Bun.file("./key.pem"), // path to TLS key
    cert: Bun.file("./cert.pem"), // path to TLS cert
    ca: Bun.file("./ca.pem"), // path to root CA certificate
  }
};

export default config;
```

To override Diffie-Helman parameters:

```ts
import { Configuration } from "brisa";

const config: Configuration = {
  tls: {
    // other config
    dhParamsFile: "/path/to/dhparams.pem", // path to Diffie Helman parameters
  }
};

export default config;
```
