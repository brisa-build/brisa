import ListInStreaming from '@/components/list-in-streaming';

export default function Homepage() {
  return (
    <>
      <div class="hero">
        <h1>
          <span class="h1_addition">Welcome to </span>Brisa
        </h1>
        <p class="edit-note">✏️ Change this list on </p>
        <code>src/components/list-in-streaming.tsx</code>
      </div>

      <section class="counter-section">
        <h2>Streaming Slow List</h2>
        <div class="counters">
          <ListInStreaming />
        </div>
      </section>
    </>
  );
}
