import type { WebContext } from 'brisa';

export default function Counter(
  { initialValue = 0 }: { initialValue: number },
  { state, i18n }: WebContext,
) {
  const count = state(initialValue);

  return (
    <div class="counter">
      <div class="counter-container">
        {/* This is the only translation that is taken to the client */}
        <h2>{i18n.t('home.client-counter')}</h2>
        <button class="increment-button" onClick={() => count.value++}></button>
        <div class="counter-value">{count.value}</div>
        <button class="decrement-button" onClick={() => count.value--}></button>
      </div>
    </div>
  );
}
