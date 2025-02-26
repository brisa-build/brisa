import type { WebContext } from 'brisa';

function CustomCounter(props: { start: number }, { state, css }: WebContext) {
  const count = state(props.start || 0);

  css`
    div {
      text-align: center;
      border: 1px solid var(--md-code-border-color);
      border-radius: 50%;
      width: fit-content;
      margin-top: 20px;
      background-color: light-dark(white, black);
      padding: 80px 20px;
      margin: 10px auto 50px auto;
    }

    p {
      font-size: 22px;
      font-weight: bold;
    }

    button {
      padding: 10px;
      border: 1px solid var(--color-primary);
      margin: 5px;
      background-color: var(--color-white);
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    button:hover {
      background-color: var(--color-light-green);
    }
  `;

  return (
    <div>
      <p>Counter: {count.value}</p>
      <button onClick={() => count.value--}>Decrement</button>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  );
}

export default CustomCounter;
