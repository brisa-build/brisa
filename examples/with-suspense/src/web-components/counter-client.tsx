import type { WebContext } from 'brisa';

function SuspenseState({}, { store }: WebContext) {
  return (
    <div className="counter">
      <div className="counter-container" style={{ height: '255px' }}>
        {store.get('counter-state')}
      </div>
    </div>
  );
}

export default async function Counter(
  { initialValue = 0 }: { initialValue: number },
  { state, store }: WebContext,
) {
  const count = state(initialValue);

  // Fake loading data on the client side
  store.set('counter-state', 'Loading...');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  store.set('counter-state', 'Loading, almost there...');
  await new Promise((resolve) => setTimeout(resolve, 500));
  store.delete('counter-state');

  return (
    <div className="counter">
      <div className="counter-container">
        <h2>Client counter</h2>
        <button className="increment-button" onClick={() => count.value++}></button>
        <div className="counter-value">{count.value}</div>
        <button className="decrement-button" onClick={() => count.value--}></button>
      </div>
    </div>
  );
}

// Connect the Suspense state to the CounterServer component
Counter.suspense = SuspenseState;
