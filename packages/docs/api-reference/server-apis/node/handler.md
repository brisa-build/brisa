---
description: The handler function is the user Brisa handler to handle the incoming requests. You can use it to create a custom server.
---

# `handler`

## Reference

### `handler(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>`

The `handler` function is the user Brisa handler to handle the incoming requests. You can use it to create a custom server.

## Example usage:

In the next example, we use the `handler` function to create a built-in [`http.createServer`](https://nodejs.org/dist/latest/docs/api/http.html#httpcreateserveroptions-requestlistener) and set up your own custom server:

```tsx 6
import http from "node:http";
import { handler } from "brisa/server";

async function customServer(req, res) {
  // Your implementation here ...
  await handler(req, res);
}

const server = http.createServer(customServer).listen(3001);
```

Alternatively, you can use the `handler` function to create a custom server with [Express](https://github.com/expressjs/express), [Connect](https://github.com/senchalabs/connect) or [Polka](https://github.com/lukeed/polka):
  

```tsx
/// file: my-server.js
import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// let Brisa handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
```


## Types

```tsx
export function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void>;
```