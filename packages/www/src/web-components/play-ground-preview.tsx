import { dangerHTML, type WebContext } from 'brisa';
import { compileWC } from 'brisa/compiler';

const source = 'brisa-playground-preview';
const workerCode = `import initSwc, { transformSync } from "https://esm.sh/@swc/wasm-web@1.7.26/wasm.js";
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
  self.postMessage(result);
});`;
const loadingSvg = `<img src="/brisa.svg" style="width: 1rem; height: 1rem; animation: spin 1s linear infinite;"/>`

export default async function PlayGroundPreview(
  {},
  {state, css, cleanup}: WebContext,
) {
  const ready = state<boolean>(false);
  const loading = state<boolean>(true);
  const workerBlob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(workerBlob);
  const worker = new Worker(url, { type: 'module', name: 'SWC Worker' });
  const selector = state<string>('playground-result');
  let count = 0;

  async function onUpdateCode(e: MessageEvent) {
    if (e.data?.type === 'ready') {
      ready.value = true;
      window.parent.postMessage({ source, ready: true });
      return;
    }
    const compiledCode = compileWC(e.data.code);

    window.parent.postMessage({ source, code: compiledCode });

    const codeBlob = new Blob([compiledCode], {
      type: 'application/javascript',
    });
    const codeUrl = URL.createObjectURL(codeBlob);
    const el = (await import(codeUrl)).default;
    const newSelector = `playground-result-${++count}`;
    customElements.define(newSelector, el);
    selector.value = newSelector;
    loading.value = false;
  }

  function onReceiveUncompiledCode(e: MessageEvent) {
    if (typeof e.data?.code !== 'string') return;
    worker.postMessage({ code: e.data.code });
  }

  worker.addEventListener('message', onUpdateCode);
  window.addEventListener('message', onReceiveUncompiledCode);
  cleanup(() => {
    worker.removeEventListener('message', onUpdateCode);
    window.removeEventListener('message', onReceiveUncompiledCode);
  });

  css`
    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
      
      0% {
        transform: rotate(0);
      }
    }
  `

  if (!ready.value) return null;

  return dangerHTML(`${loading.value ? loadingSvg : ''}
<${selector.value}></${selector.value}>`);
}
