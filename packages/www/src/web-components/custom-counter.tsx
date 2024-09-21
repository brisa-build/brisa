import type { WebContext } from 'brisa';

function CustomCounter(props: { start: number }, { state, css }: WebContext) {
  const count = state(props.start || 0);

  css`
    div {
      text-align: center;
      border: 1px solid var(--md-code-border-color);
      border-radius: 8px;
      margin-top: 20px;
      transform: rotate(1deg);
      background-color: light-dark(white, black);
      padding: 10px;
    }
    
    p {
      font-size: 22px;
      font-weight: bold;
    }

    button{
      padding:10px;
      border:1px solid var(--color-primary); 
      margin:5px;
      background-color: var(--color-white);
      border-radius: 5px;
      cursor: pointer;
    }
  `;

  return (
    <div>
      <p>Counter: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
      <button onClick={() => count.value--}>Decrement</button>
    </div>
  );
}

export default CustomCounter;
