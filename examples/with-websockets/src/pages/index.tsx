export default function Homepage() {
  return (
    <>
      <div className="hero">
        <h1>
          <span className="h1_addition">Welcome to </span>Brisa
        </h1>
        <p className="edit-note">✏️ WebSocket Chat Example</p>
        <code>src/websockets.ts</code>
        <code>src/web-components/ws-chat.tsx</code>
      </div>
      <ws-chat />
    </>
  );
}
