import type { WebContext } from 'brisa';
import { compileWC } from 'brisa/compiler';

const defaultValue = ` export default function Counter({ name }: any, { state }: any) {
  const count = state(0);

  return (
    <p>
      <button onClick={() => count.value++}>+</button>
      <span> {name} {count.value} </span>
      <button onClick={() => count.value--}>-</button>
    </p>
  )
}`;

const workerCode = `import initSwc, { transformSync } from "https://unpkg.com/@swc/wasm-web@1.7.26/wasm.js";
initSwc().then(() => self.postMessage({ type: "ready" }));
self.addEventListener("message", async (event) => {
  const { code } = event.data;
  const result = transformSync(code, {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: true,
        dynamicImport: true,
      },
       transform: {
        react: {
          runtime: "automatic",
        },
      },
      target: "es2020",
    },
  });
  self.postMessage(result.code);
});`;

export default async function PlayGround(
  {},
  { state, cleanup, css, self }: WebContext,
) {
  const ready = state<boolean>(false);
  const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(workerBlob);
  const worker = new Worker(url, { type: 'module', name: 'SWC Worker' });
  const code = state<string>('');
  let count = 0;

  async function onUpdateCode(e) {
    if (e.data?.type === 'ready') {
      ready.value = true;
      worker.postMessage({ code: defaultValue });
      return;
    }
    const compiledCode = compileWC(e.data);
    code.value = compiledCode;
    const js = new Blob(
      [
        compiledCode.replace(
          'brisa/client',
          'https://unpkg.com/brisa@latest/client-simplified/index.js',
        ),
      ],
      { type: 'application/javascript' },
    );
    const element = (await import(URL.createObjectURL(js))).default;

    // Note: this is a hack that will be improved in the future
    const selector = `playground-result-${++count}`;

    // remove the previous element
    customElements.define(selector, element);
    const prev = self.shadowRoot!.querySelector('#playground-result')!;
    const newEl = document.createElement(selector);
    newEl.id = 'playground-result';
    prev.replaceWith(newEl);
  }

  worker.addEventListener('message', onUpdateCode);
  cleanup(() => worker.removeEventListener('message', onUpdateCode));

  async function onInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    if (!ready.value) {
      console.error('Worker is not ready yet');
      return;
    }
    worker.postMessage({ code: target.value });
  }

  css`
    .playground {
      display: flex;
      gap: 1rem;
      margin: 50px;
    }

    .output {
      width: 100%;
    }

    .wc {
      border: 1px solid #ccc;
      border-radius: 0.5rem;
      padding: 1rem;
      background-color: #f9f9f9;
    }

    .original-code {
      width: 100%;
    }

    textarea {
      width: 100%;
      field-sizing: content;
      height: auto;
      font-size: 1rem;
      border-radius: 0.5rem;
      border: 1px solid #ccc;
    }
  `;

  return (
    <section class="playground">
      <div class="original-code">
        <h2>Original code:</h2>
        <textarea onInput={onInput}>{defaultValue}</textarea>
      </div>
      <div class="output">
        {ready.value ? (
          <>
            <h2>Web Component:</h2>
            <div class="wc">
              {/* @ts-ignore */}
              <playground-result-0 id="playground-result" />
            </div>
            <h2>Compiled Code:</h2>
            <textarea onInput={onInput} disabled>
              {code.value}
            </textarea>
          </>
        ) : (
          'Compiling...'
        )}
      </div>
    </section>
  );
}
