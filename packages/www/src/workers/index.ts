import initSwc, {
  transformSync,
} from 'https://unpkg.com/@swc/wasm-web@1.7.26/wasm.js';

initSwc();
self.addEventListener('message', async (event) => {
  const { code } = event.data;
  const result = transformSync(code, {
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
        dynamicImport: true,
      },
      target: 'es2020',
    },
  });
  self.postMessage(result);
});

// How to use it:
//
// ```ts
// const worker = new Worker("path/to/worker.js");
// worker.postMessage({ code: "const a = 1;" });
// worker.onmessage = (event) => {
//   console.log(event.data);
// };
