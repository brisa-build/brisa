---
description: Get the server instace of Brisa
---

# `getServer`

## Reference

### `getServer(): Server`

The `getServer` function is used to get the server instance of Brisa. It is useful to access the server instance in the server components.

## Example usage:

```ts
import { getServer } from "brisa/server";

// ...
const server = getServer();
/* 
{
  address: {
    address: "::",
    family: "IPv6",
    port: 63621,
  },
  development: true,
  fetch: [Function: fetch],
  hostname: "localhost",
  id: "",
  pendingRequests: 3,
  pendingWebSockets: 1,
  port: 63621,
  protocol: "http",
  publish: [Function: publish],
  ref: [Function: ref],
  reload: [Function: reload],
  requestIP: [Function: requestIP],
  stop: [Function: stop],
  subscriberCount: [Function: subscriberCount],
  timeout: [Function: timeout],
  unref: [Function: unref],
  upgrade: [Function: upgrade],
  url: URL {
    href: "http://localhost:63621/",
    origin: "http://localhost:63621",
    protocol: "http:",
    username: "",
    password: "",
    host: "localhost:63621",
    hostname: "localhost",
    port: "63621",
    pathname: "/",
    hash: "",
    search: "",
    searchParams: URLSearchParams {},
    toJSON: [Function: toJSON],
    toString: [Function: toString],
  },
  [Symbol(Symbol.dispose)]: [Function: dispose],
}
*/
```

### Types

```ts
export function getServer(): Server;
```

And `Server` is [Bun.js Server Type](https://bun.sh/docs/api/http#reference) after `Bun.serve`:

```ts
interface Server {
  fetch(request: Request | string): Response | Promise<Response>;
  publish(
    compress?: boolean,
    data: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer,
    topic: string,
  ): ServerWebSocketSendStatus;
  ref(): void;
  reload(options: Serve): void;
  requestIP(request: Request): SocketAddress | null;
  stop(closeActiveConnections?: boolean): void;
  unref(): void;
  upgrade<T = undefined>(
    options?: {
      data?: T;
      headers?: Bun.HeadersInit;
    },
    request: Request,
  ): boolean;
  subscriberCount: (topic: string) => number;
  timeout: (ms: number) => void;

  readonly development: boolean;
  readonly hostname: string;
  readonly id: string;
  readonly pendingRequests: number;
  readonly pendingWebSockets: number;
  readonly port: number;
  readonly url: URL;
  readonly protocol: string;
  readonly address: AddressInfo;
  readonly [Symbol.dispose]: () => void;
}
```
