---
description: Learn how to configure TLS
---

# TLS

Brisa supports TLS out of the box thanks to [Bun](https://bun.sh/docs/api/http#tls), powered by [BoringSSL](https://boringssl.googlesource.com/boringssl). Enable TLS by passing in a value for `key` and `cert`; both are required to enable TLS.

**brisa.config.ts**:

```ts
import type { Configuration } from "brisa";

export default {
  tls: {
    key: Bun.file("./key.pem"),
    cert: Bun.file("./cert.pem"),
  },
} satisfies Configuration;
```

The `key` and `cert` fields expect the contents of your TLS key and certificate, not a path to it. This can be a string, BunFile, TypedArray, or Buffer.

**brisa.config.ts**:

```ts
import type { Configuration } from "brisa";

export default {
  tls: {
    // BunFile
    key: Bun.file("./key.pem"),
    // Buffer
    key: fs.readFileSync("./key.pem"),
    // string
    key: fs.readFileSync("./key.pem", "utf8"),
    // array of above
    key: [Bun.file("./key1.pem"), Bun.file("./key2.pem")],
  },
} satisfies Configuration;
```

If your private key is encrypted with a passphrase, provide a value for `passphrase` to decrypt it.

**brisa.config.ts**:

```ts
import type { Configuration } from "brisa";

export default {
  tls: {
    key: Bun.file("./key.pem"),
    cert: Bun.file("./cert.pem"),
    passphrase: "my-secret-passphrase",
  },
} satisfies Configuration;
```

Optionally, you can override the trusted CA certificates by passing a value for `ca`. By default, the server will trust the list of well-known CAs curated by Mozilla. When `ca` is specified, the Mozilla list is overwritten.

**brisa.config.ts**:

```ts
import type { Configuration } from "brisa";

export default {
  tls: {
    key: Bun.file("./key.pem"), // path to TLS key
    cert: Bun.file("./cert.pem"), // path to TLS cert
    ca: Bun.file("./ca.pem"), // path to root CA certificate
  },
} satisfies Configuration;
```

To override Diffie-Helman parameters:

```ts
import type { Configuration } from "brisa";

export default {
  tls: {
    // other config
    dhParamsFile: "/path/to/dhparams.pem", // path to Diffie Helman parameters
  },
} satisfies Configuration;
```
