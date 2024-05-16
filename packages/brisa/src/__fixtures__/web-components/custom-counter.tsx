import type { WebContext } from "brisa";

export default function Counter(
  { initialValue = 0 }: { initialValue: number },
  { state }: WebContext,
) {
  const count = state(initialValue);

  return (
    <div>
      <h2>Client counter</h2>
      <button onClick={() => count.value++}>+</button>
      {count.value}
      <button onClick={() => count.value--}>-</button>
    </div>
  );
}
