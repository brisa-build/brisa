import ListInStreaming from '@/components/list-in-streaming';

export default function Homepage() {
  return (
    <>
      <div className="hero">
        <h1>
          <span className="h1_addition">Welcome to </span>Brisa
        </h1>
        <p className="edit-note">✏️ Change this list on </p>
        <code>src/components/list-in-streaming.tsx</code>
      </div>

      <section className="counter-section">
        <h2>Streaming Slow List</h2>
        <div className="counters">
          <ListInStreaming />
        </div>
      </section>
    </>
  );
}
