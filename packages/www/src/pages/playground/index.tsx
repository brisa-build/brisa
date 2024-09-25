import { dangerHTML } from 'brisa';

const defaultValue = `// src/web-components/wc-counter.tsx
import type { WebContext } from 'brisa';

export default function Counter({ name }: { name: string }, { state }: WebContext) {
  const count = state(0);

  return (
    <p>
      <button onClick={() => count.value++}>+</button>
      <span> {name} {count.value} </span>
      <button onClick={() => count.value--}>-</button>
    </p>
  )
}`;

export default function Playground() {
  return (
    <>
      <main style={{ paddingTop: '100px' }}>
        <play-ground skipSSR defaultValue={defaultValue}>
          <div
            slot="code-editor"
            style={{
              height: '500px',
              width: '100%',
              border: '1px solid var(--color-primary)',
            }}
            id="code-editor"
          >
            <script type="module">
              {dangerHTML(`
                import * as monaco from 'https://esm.sh/monaco-editor';
                import tsWorker from 'https://esm.sh/monaco-editor/esm/vs/language/typescript/ts.worker?worker';

                window.MonacoEnvironment  = { 
                  getWorker(_, label) {
                    return new tsWorker();
                  }
                };

                const modelUri = monaco.Uri.file("wc-counter.tsx")
                const existingModel = monaco.editor.getModels().find(m => m.uri.toString() === modelUri.toString());
                const codeModel = existingModel ?? monaco.editor.createModel(\`${defaultValue}\`, "typescript", modelUri);

                 monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                    jsx: monaco.languages.typescript.JsxEmit.React, 
                    target: monaco.languages.typescript.ScriptTarget.ESNext,
                    allowNonTsExtensions: true,
                });

               const preview = document.querySelector('#preview-iframe');
               const editor = monaco.editor.create(document.querySelector('#code-editor'), {
                  model: codeModel,
                  language: "typescript",
                  theme: document.body.classList.contains('dark') ? "vs-dark" : "vs-light",
                  automaticLayout: true
              });
              editor.onDidChangeModelContent((e) => {
                  preview.contentWindow.postMessage({ code: editor.getValue() }, '*');
              });
              window._xm = "native";
            `)}
            </script>
          </div>
          <iframe
            slot="preview-iframe"
            id="preview-iframe"
            style={{
              width: '100%',
              border: '1px solid var(--color-primary)',
              height: '500px',
              color: 'var(--color-primary)',
            }}
            src="/playground/preview"
          />
        </play-ground>
      </main>
    </>
  );
}

export function Head() {
  return (
    <>
      <link
        rel="preload"
        href="https://esm.sh/monaco-editor/min/vs/editor/editor.main.css"
        as="style"
      />
      <link
        rel="stylesheet"
        href="https://esm.sh/monaco-editor/min/vs/editor/editor.main.css"
      />
    </>
  );
}
