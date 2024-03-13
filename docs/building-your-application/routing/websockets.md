---
title: Real-time Communication with Websockets
description: Explore the implementation of websockets for real-time communication in your application.
---

Websockets provide a powerful mechanism for establishing a full-duplex communication channel between a client and a server. This enables real-time updates and interactions in your application.

Brisa supports server-side WebSockets, with on-the-fly compression, TLS support, and a [Bun](https://bun.sh/docs/api/websockets)-native publish-subscribe API.

> [!NOTE]
>
> Bun's WebSockets are fast, ~700,000 messages sent per second.

## Start a WebSocket server API

For this purpose it is necessary to create the file `src/websocket.(ts|js)` _(or `src/websocket/index.(ts|js)`)_ and you can export these functions:

```ts
import { ServerWebSocket } from "bun";

export function attach(request: Request) {
  // attach contextual data to the ws.data
  return { foo: "foo" }; // ws.data.foo
}

export function message(ws: ServerWebSocket, message: string) {
  // a message is received
}

export function open(ws: ServerWebSocket) {
  // a socket is opened
}

export function close(ws: ServerWebSocket) {
  // a socket is closed
}

export function drain(ws: ServerWebSocket) {
  // the socket is ready to receive more data
}
```

> [!IMPORTANT]
>
> These handlers are declared once per server, instead of per socket. So, instead of using an event-based API it is reused for each connection, this leads to less memory usage and less time spent adding/removing event listeners.

### `attach`

The `attach` function is responsible for attaching contextual data to the `ws.data` property of the WebSocket.

Before a WebSocket connection is established, this function is invoked, providing access to the initial request (Request).

You can use this function to associate relevant information or metadata with the WebSocket connection.

```ts
export function attach(request: Request) {
  const cookies = parseCookies(req.headers.get("Cookie"));

  return {
    createdAt: Date.now(),
    channelId: new URL(req.url).searchParams.get("channelId"),
    authToken: cookies["X-Token"],
  },
}
```

This information will be accessible through `ws.data`.

### `message`

The message function is triggered whenever a message is received on the WebSocket connection.

It accepts two parameters: `ws` (the `ServerWebSocket` instance) and `message` (the received message as a string).

You can implement logic within this function to handle and process incoming messages. The message function provides the means to respond to client messages in real-time and execute corresponding actions based on the content of the received message.

### `open`

The `open` function is called when a new WebSocket connection is established and opened.

It accepts one parameters: `ws` (the `ServerWebSocket` instance).

You can use this function to perform setup tasks or execute actions specific to the initiation of a WebSocket connection.

This could include tasks such as logging, authentication, or broadcasting a welcome message to the connected client.

### `close`

The `close` function is invoked when a WebSocket connection is closed.

It accepts one parameters: `ws` (the `ServerWebSocket` instance).

It allows you to define cleanup procedures or perform actions specific to the closure of a WebSocket connection. For example, scenarios like logging disconnections, updating user statuses, or releasing resources related to the closed connection.

### `drain`

The `drain` function is called when the WebSocket is ready to receive more data. It signifies that the underlying transport is available for sending additional messages.

You can use this function to implement custom logic related to handling the readiness of the WebSocket to receive more data. This might include managing queues of messages to be sent or coordinating the flow of real-time updates based on the current state of the WebSocket connection.

### Sending messages

Each `ServerWebSocket` instance has a `.send()` method for sending messages to the client. It supports a range of input types.

```ts
ws.send("Hello world"); // string
ws.send(response.arrayBuffer()); // ArrayBuffer
ws.send(new Uint8Array([1, 2, 3])); // TypedArray | DataView
```

> [!TIP]
>
> You have access to the `ServerWebSocket` from any server-component, middleware, API route, etc. Since it is inside the [`RequestContext`](/building-your-application/data-fetching/request-context).

This is an example of sending a message from an [API route](docs/building-your-application/routing/api-routes):

**`src/api/hello-world.ts`**

```ts
import { type RequestContext } from "brisa";

export function GET({ ws, i18n }: RequestContext) {
  const message = i18n.t("hello-world");

  // Sending a WebSocket message from an API route
  ws.send(message);

  return new Response(message, {
    headers: { "content-type": "text/plain" },
  });
}
```

### Pub/Sub

Bun's `ServerWebSocket` implementation implements a native publish-subscribe API for topic-based broadcasting. Individual sockets can `.subscribe()` to a topic (specified with a string identifier) and `.publish()` messages to all other subscribers to that topic (excluding itself). This topic-based broadcast API is similar to [MQTT](https://en.wikipedia.org/wiki/MQTT) and [Redis Pub/Sub](https://redis.io/topics/pubsub).

**`src/websocket.ts`**

```ts
export function open(ws) {
  const msg = `${ws.data.username} has entered the chat`;
  ws.subscribe("the-group-chat");
  ws.publish("the-group-chat", msg);
}

export function message(ws, message) {
  // this is a group chat
  // so the server re-broadcasts incoming message to everyone
  ws.publish("the-group-chat", `${ws.data.username}: ${message}`);
}

export function close(ws) {
  const msg = `${ws.data.username} has left the chat`;
  ws.unsubscribe("the-group-chat");
  ws.publish("the-group-chat", msg);
}
```

Calling `ws.publish(data)` will send the message to **all subscribers** of a topic **except the socket** that called `ws.publish()`.

To send a message to **all subscribers** of a topic, use the `server.publish()` method on the `Server` instance. You can get the `server` instance via `globalThis.brisaServer`:

```ts
const server = globalThis.brisaServer;
server.publish("send-message-to-all-subscribers", msg);
```

### Compression

Compression can be enabled for individual messages by passing a boolean as the second argument to `.send()` or as the third argument to `.publish()`.

```ts
ws.send(message, true);
ws.publish(topic, message, true);
```

#### Backpressure

The `.send(message)` method of `ServerWebSocket` returns a `number` indicating the result of the operation.

- `-1` — The message was enqueued but there is backpressure
- `0` — The message was dropped due to a connection issue
- `1+` — The number of bytes sent

This gives you better control over backpressure in your server.

## Start a WebSocket client API

Starting a WebSocket client in Brisa involves using the [WebSocket Web API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API):

### Connect to WebSocket Server

To establish a connection to the WebSocket server, you can use the standard [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) in the browser. The following example demonstrates how to initiate a connection in a browser environment:

```ts
const ws = new WebSocket("wss://your-server.com");
```

### Handle WebSocket Events inside Web-components

WebSocket connections trigger various events during their lifecycle. To react to these events, you can attach event listeners to the WebSocket instance. Common events include `open`, `message`, `close`, and `error`. The following snippet illustrates how to handle these events:

```ts
// Event listener for when the connection is established
ws.addEventListener("open", (event) => {
  console.log("WebSocket connection opened:", event);
});

// Event listener for incoming messages
ws.addEventListener("message", (event) => {
  console.log("Received message:", event.data);
});

// Event listener for when the connection is closed
ws.addEventListener("close", (event) => {
  console.log("WebSocket connection closed:", event);
});

// Event listener for errors
ws.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});
```

> [!CAUTION]
>
> WebSocket connections may not persist indefinitely. Various factors, such as network issues, server restarts, or client-side disruptions, can lead to the termination of WebSocket connections. It is crucial to implement appropriate error handling and reconnection strategies on the client side to gracefully handle unexpected disconnections.

### Send Messages to Server

You can send messages to the WebSocket server using the `send` method. The following example demonstrates how to send a simple text message:

```ts
ws.send("Hello, server!");
```

### Close WebSocket Connection

When you want to close the WebSocket connection, you can call the close method. Optionally, you can provide a reason and code for the closure:

```ts
ws.close();
// or
ws.close(1000, "Closing connection gracefully");
```
