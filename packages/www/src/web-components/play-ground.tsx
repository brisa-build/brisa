import type { WebContext } from 'brisa';

export default async function PlayGround(
  { defaultValue }: { defaultValue: string },
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
