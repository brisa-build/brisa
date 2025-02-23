import type { WebContext } from 'brisa';

export default function Counter(
  { initialValue = 0 }: { initialValue: number },
  { state, i18n }: WebContext,
) {
  const count = state(initialValue);

  return (
    <div className="counter">
      <div className="counter-container">
        {/* This is the only translation that is taken to the client */}
        <h2>{i18n.t('home.client-counter')}</h2>
        <button className="increment-button" onClick={() => count.value++}></button>
        <div className="counter-value">{count.value}</div>
        <button className="decrement-button" onClick={() => count.value--}></button>
      </div>
    </div>
  );
}
