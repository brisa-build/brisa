import CounterServer from '@/components/counter-server';

export default function Homepage() {
  return (
    <>
      <div className="hero">
        <h1>
          <span className="h1_addition">Welcome to </span>Brisa
        </h1>
        <p className="edit-note">✏️ Change this page on </p>
        <code>src/pages/index.tsx</code>
      </div>

      <section className="counter-section">
        <h2>Counters</h2>
        <div className="counters">
          <counter-client initialValue={42} />
          <CounterServer initialValue={37} />
        </div>
      </section>
    </>
  );
}
