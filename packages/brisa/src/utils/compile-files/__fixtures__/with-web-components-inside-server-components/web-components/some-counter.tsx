import type { WebContext } from "brisa";

export default function SomeCounter({}, { state }: WebContext) {
  const count = state(0);

  return (
    <div>
      <h1>Counter</h1>
      <button onClick={() => (count.value += 1)}>Increment</button>
      <button onClick={() => (count.value -= 1)}>Decrement</button>
      <p>{count.value}</p>
    </div>
  );
}
