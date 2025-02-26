import type { RequestContext } from 'brisa';
import { renderComponent } from 'brisa/server';

export default function CounterServer(
  { initialValue = 0 }: { initialValue: number },
  { store }: RequestContext,
) {
  if (!store.has('count')) store.set('count', initialValue);
  store.transferToClient(['count']);

  function increment() {
    store.set('count', store.get('count') + 1);
    renderComponent();
  }

  function decrement() {
    store.set('count', store.get('count') - 1);
    renderComponent();
  }

  return (
    <div className="counter">
      <div className="counter-container">
        <h2>Server counter</h2>
        <button className="increment-button" onClick={increment}></button>
        <div className="counter-value">{store.get('count')}</div>
        <button className="decrement-button" onClick={decrement}></button>
      </div>
    </div>
  );
}
