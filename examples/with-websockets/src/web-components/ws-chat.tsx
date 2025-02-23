import type { WebContext } from 'brisa';

export default function WSChat({}, { state, onMount }: WebContext) {
  const messages = state<string[]>([]);
  const loading = state<boolean>(true);
  const inputRef = state<HTMLInputElement | null>(null);
  let ws;

  function connect() {
    ws = new WebSocket('ws://localhost:3000/ws-chat');

    ws.onmessage = (event) => {
      messages.value = [...messages.peek(), event.data];
      localStorage.setItem('messages', JSON.stringify(messages.value));
    };

    ws.onopen = () => {
      loading.value = false;
    };

    ws.onclose = () => {
      console.log('Disconnected');
      messages.value = [];
    };

    ws.onerror = () => {
      console.log('Error');
    };
  }

  function sendMessage(event: Event) {
    event.preventDefault();

    if (ws && ws.readyState === WebSocket.OPEN) {
      const input = inputRef.value;
      ws.send(input.value);
      input.value = '';
    }
  }

  onMount(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      messages.value = JSON.parse(storedMessages);
    }
    connect();
  });

  if (loading.value) return <p>Loading...</p>;

  return (
    <div>
      <h3>Open different browser tab to talk to yourself</h3>
      <div>
        {messages.value.map((msg) => (
          <p>{msg}</p>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input ref={inputRef} type="text" />
        <button type="submit">Send</button>
        <button type="button" onClick={connect}>
          Reconnect
        </button>
      </form>
    </div>
  );
}
