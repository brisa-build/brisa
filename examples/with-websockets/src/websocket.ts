import type { ServerWebSocket } from 'bun';

export function open(ws: ServerWebSocket) {
  ws.subscribe('ws-chat');
}

export function message(ws: ServerWebSocket, message: string) {
  const server = globalThis.brisaServer;
  if (message) server.publish('ws-chat', message);
}

export function close(ws: ServerWebSocket) {
  ws.unsubscribe('ws-chat');
}
