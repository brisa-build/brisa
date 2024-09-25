import { dangerHTML } from "brisa";

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

export default function Playground() {
  return (
    <>
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
    <main style={{ paddingTop: '120px'}}>
      <play-ground skipSSR defaultValue={defaultValue}>
        <div
          slot="code-editor"
          style={{ height: '500px', width: '100%' }}
          id="code-editor"
        ></div>
        <iframe
          slot="preview-iframe"
          id="preview-iframe"
          src="/playground/preview"
        />
      </play-ground>
    </main>
    </>
  );
}
