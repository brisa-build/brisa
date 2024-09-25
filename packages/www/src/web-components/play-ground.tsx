import { dangerHTML, type WebContext } from 'brisa';

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

export default async function PlayGround(
  {},
  { state, css, cleanup, onMount, self }: WebContext,
) {
  const code = state<string>('');
  const preview: HTMLIFrameElement = self.querySelector('#preview-iframe')!;

  function onReceiveCompiledCode(e: MessageEvent) {
    if (e.data.source !== 'brisa-playground-preview') return;
    if (e.data.ready) sendDefaultCode();
    if (typeof e.data.code === 'string') {
      code.value = e.data.code;
    }
  }

  function sendDefaultCode() {
    preview.contentWindow?.postMessage({ code: defaultValue });
  }

  onMount(() => {
    window.addEventListener('message', onReceiveCompiledCode);
  });

  cleanup(() => {
    window.removeEventListener('message', onReceiveCompiledCode);
  });

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
      <script type="module">
        {dangerHTML(`
          import * as monaco from 'https://esm.sh/monaco-editor';
          import editorWorker from 'https://esm.sh/monaco-editor/esm/vs/editor/editor.worker?worker';
          import jsonWorker from 'https://esm.sh/monaco-editor/esm/vs/language/json/json.worker?worker';
          import cssWorker from 'https://esm.sh/monaco-editor/esm/vs/language/css/css.worker?worker';
          import htmlWorker from 'https://esm.sh/monaco-editor/esm/vs/language/html/html.worker?worker';
          import tsWorker from 'https://esm.sh/monaco-editor/esm/vs/language/typescript/ts.worker?worker';

          self.MonacoEnvironment  = { 
            getWorker(_, label) {
              if (label === 'json') return new jsonWorker();
              if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
              if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
              if (label === 'typescript' || label === 'javascript') return new tsWorker();
              return new editorWorker();
            }
          };

          const modelUri = monaco.Uri.file("wc-counter.tsx")
          const codeModel = monaco.editor.createModel(\`${defaultValue}\`, "typescript", modelUri);

          monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
              jsx: monaco.languages.typescript.JsxEmit.React, 
              target: monaco.languages.typescript.ScriptTarget.ESNext,
              allowNonTsExtensions: true
          });

          const preview = document.querySelector('#preview-iframe');
          const editor = monaco.editor.create(document.querySelector('#code-editor'), {
           model: codeModel,
           language: "typescript",
           theme: "vs-dark",
           automaticLayout: true
         });
         editor.onDidChangeModelContent((e) => {
            preview.contentWindow.postMessage({ code: editor.getValue() }, '*');
         });
        `)}
      </script>
      <div class="original-code">
        <h2>Original code:</h2>
        <slot name="code-editor" />
      </div>
      <div class="output">
        <h2>Web Component:</h2>
        <slot name="preview-iframe" />
        <h2>Compiled Code:</h2>
        <textarea disabled>{code.value}</textarea>
      </div>
    </section>
  );
}
