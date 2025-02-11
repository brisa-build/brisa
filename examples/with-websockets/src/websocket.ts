import { ServerWebSocket } from "bun";

export function open(ws: ServerWebSocket) {
  ws.subscribe('ws-chat');
}

export function message(ws: ServerWebSocket, message: string) {
  console.log({message});
  const server = globalThis.brisaServer;
  if (message) server.publish(message, 'ws-chat');
}

export function close(ws: ServerWebSocket) {
  ws.unsubscribe('ws-chat');
}
