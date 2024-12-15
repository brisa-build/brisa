import type { RequestContext } from 'brisa';
import { Initiator, renderPage } from 'brisa/server';

function SuspenseState() {
  return (
    <div class="counter">
      <div class="counter-container" style={{ height: '255px' }}>
        Loading...
      </div>
    </div>
  );
}

export default async function CounterServer(
  { initialValue = 0 }: { initialValue: number },
  { store, initiator }: RequestContext,
) {
  // Fake loading data on the initial request
  if (initiator === Initiator.INITIAL_REQUEST) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (!store.has('count')) store.set('count', initialValue);
  store.transferToClient(['count']);

  function increment() {
    store.set('count', store.get('count') + 1);
    renderPage();
  }

  function decrement() {
    store.set('count', store.get('count') - 1);
    renderPage();
  }

  return (
    <div class="counter">
      <div class="counter-container">
        <h2>Server counter</h2>
        <button class="increment-button" onClick={increment}></button>
        <div class="counter-value">{store.get('count')}</div>
        <button class="decrement-button" onClick={decrement}></button>
      </div>
    </div>
  );
}

// Connect the Suspense state to the CounterServer component
CounterServer.suspense = SuspenseState;
