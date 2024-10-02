import { dangerHTML as esm } from 'brisa';
import getMonacoEditorExtraLibs from '@/helpers/monaco-extra-libs';

import '@/styles/playground.css';

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
    <main style={{ paddingTop: '100px' }}>
      <h1 style={{ display: 'none' }}>Brisa Playground</h1>
      <play-ground skipSSR defaultValue={defaultValue}>
        <div
          slot="code-editor"
          class="editor"
          style={{
            height: '100%',
            width: '100%',
            border: '0',
          }}
          id="code-editor"
        >
          <script type="module">
            {esm(`
              import * as monaco from 'https://esm.sh/monaco-editor';
              import tsWorker from 'https://esm.sh/monaco-editor/esm/vs/language/typescript/ts.worker?worker';
              import { MonacoJsxSyntaxHighlight, getWorker } from 'https://esm.sh/monaco-jsx-syntax-highlight'
              
              const monacoJsxSyntaxHighlight = new MonacoJsxSyntaxHighlight(getWorker(), monaco)

              window.MonacoEnvironment  = { 
                getWorker(_, label) {
                  return new tsWorker();
                }
              };

              const modelUri = monaco.Uri.file("wc-counter.tsx")
              const existingModel = monaco.editor.getModels().find(m => m.uri.toString() === modelUri.toString());
              const codeModel = existingModel ?? monaco.editor.createModel(\`${defaultValue}\`, "typescript", modelUri);

              monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                jsx: monaco.languages.typescript.JsxEmit.Preserve,
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                esModuleInterop: true,
                moduleResolution: monaco.languages.typescript.ModuleResolutionKind.Classic,
                allowNonTsExtensions: true,
              });

              ${getMonacoEditorExtraLibs()}

              monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false,
              });
              
              const preview = document.querySelector('#preview-iframe');

              const editor = monaco.editor.create(document.querySelector('#code-editor'), {
                theme: document.body.classList.contains('dark') ? "vs-dark" : "vs-light",
                automaticLayout: true,
              });

              const { highlighter } = monacoJsxSyntaxHighlight.highlighterBuilder({
                editor,
                filePath: modelUri?.toString() ?? modelUri?.path,
              });

              highlighter();

              editor.setModel(codeModel);

              editor.onDidChangeModelContent((e) => {
                highlighter()
                preview.contentWindow.postMessage({ code: editor.getValue() }, '*');
              });

              editor.onDidChangeModelContent(() => {
                highlighter()
              })

              window._xm = "native";
              window.changeTheme = monaco.editor.setTheme.bind(monaco.editor);
            `)}
          </script>
        </div>
        <iframe
          slot="preview-iframe"
          id="preview-iframe"
          title="Preview"
          style={{
            width: '100%',
            border: '0',
            height: '100%',
            color: 'var(--color-primary)',
          }}
          src="/playground/preview"
        />
      </play-ground>
    </main>
  );
}

export function Head() {
  const title = `Brisa Playground`;
  const description = `Play with Brisa in the browser! Web Components are the future of web development, and Brisa makes it easy to build them with JSX, signals and TypeScript.`;
  const keywords = `brisa, playground, web components, jsx, typescript`;

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
      <title id="title">{title}</title>
      <meta id="meta:title" name="title" content={title} />
      <meta id="og:title" property="og:title" content={title} />
      <meta id="twitter:title" property="twitter:title" content={title} />
      <meta id="keywords" name="keywords" content={keywords} />
      <meta id="meta:description" name="description" content={description} />
      <meta
        id="og:description"
        property="og:description"
        content={description}
      />
      <meta
        id="twitter:description"
        property="twitter:description"
        content={description}
      />
    </>
  );
}
