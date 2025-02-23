import { renderComponent } from 'brisa/server';

export default function CounterServer({
  initialValue = 0,
}: {
  initialValue: number;
}) {
  function increment(e: Event) {
    const value = Number((e.target as HTMLButtonElement).dataset.value);
    renderComponent({ element: <CounterServer initialValue={value + 1} /> });
  }

  function decrement(e: Event) {
    const value = Number((e.target as HTMLButtonElement).dataset.value);
    renderComponent({ element: <CounterServer initialValue={value - 1} /> });
  }

  return (
    <div className="counter">
      <div className="counter-container">
        <h2>Server counter</h2>
        <button
          data-value={initialValue}
          className="increment-button"
          onClick={increment}
        ></button>
        <div className="counter-value">{initialValue}</div>
        <button
          data-value={initialValue}
          className="decrement-button"
          onClick={decrement}
        ></button>
      </div>
    </div>
  );
}
