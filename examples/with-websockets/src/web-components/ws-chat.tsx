import type { WebContext } from 'brisa';

export default function WSChat({}, { state, onMount }: WebContext) {
  const messages = state<string[]>([]);
  const inputRef = state<HTMLInputElement | null>(null);
  let ws;

  function connect() {
    ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      if (event.data !== 'ws-chat') return;
      messages.value = [...messages.peek(), event.data];
    };
  }

  function sendMessage() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const input = inputRef.value;
      ws.send(input.value);
      input.value = '';
    }
  }

  onMount(connect);

  return (
    <div>
      <h3>Open different tabs / browsers</h3>
      <div>
        {messages.value.map((msg) => (
          <p>{msg}</p>
        ))}
      </div>
      <input ref={inputRef} type="text" />
      <button onClick={sendMessage}>Send</button>
      <button onClick={connect}>Reconnect</button>
    </div>
  );
}
