export function message(ws: WebSocket, message: string) {
  console.log('message', message);
}

export function open(ws: WebSocket) {
  console.log('open');
}

export function close(ws: WebSocket) {
  console.log('close');
}

export function drain(ws: WebSocket) {
  console.log('drain');
}
