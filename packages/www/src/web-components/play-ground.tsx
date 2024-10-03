import type { WebContext } from 'brisa';

export default async function PlayGround(
  { defaultValue }: { defaultValue: string },
  { state, css, cleanup, onMount, self }: WebContext,
) {
  const code = state<string>('');
  const preview: HTMLIFrameElement = self.querySelector('#preview-iframe')!;
  const activeTab = state<string>('tab-wc');

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
      flex-direction: row;
      gap: 0.5rem;
      margin: 0;
      height: calc(100vh - 100px);
      background-color: var(--playground-bg-color);
    }

    .original-code {
      width: 50%;
      height: 100%;
    }

    .output {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: var(--color-white);

      .tab-list {
        display: flex;
        flex-shrink: 0;
        margin: 0;
      }

      button[role="tab"] {
        flex: 1;
        border: none;
        background: none;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      button[role="tab"]:hover {
        background-color: var(--color-light-gray);
      }
      button[role="tab"][aria-selected="true"] {
        border-bottom: 2px solid var(--color-dark);
      }

      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: flex;
        flex-grow: 1;
      }
    }

    #tab-compiled {
      padding: 0.5rem;
    }
    #tab-compiled textarea {
      display: flex;
      flex-grow: 1;
      resize: none;
      field-sizing: content;
      font-size: 1rem;
      border-radius: 0.5rem;
    }

    @media (max-width: 968px) {
      .playground {
        flex-direction: column;
      }

      .original-code {
        width: 100%;
        height: 100%;
      }

      .output {
        width: 100%;
      }
     }
  `;

  return (
    <section class="playground">
      <div class="original-code">
        <slot name="code-editor" />
      </div>
      <div class="output">
        <div role="tablist" class="tab-list">
          <button
            id="tab-wc"
            type="button"
            role="tab"
            title="Web Component"
            aria-label="Web Component"
            aria-selected={activeTab.value === 'tab-wc'}
            onClick={() => (activeTab.value = 'tab-wc')}
          >
            Web Component
          </button>
          <button
            id="tab-compiled"
            type="button"
            role="tab"
            title="Compiled Code"
            aria-label="Compiled Code"
            aria-selected={activeTab.value === 'tab-compiled'}
            onClick={() => (activeTab.value = 'tab-compiled')}
          >
            Compiled Code
          </button>
        </div>

        <div
          id="tab-wc"
          class={`tab-content ${activeTab.value === 'tab-wc' ? 'active' : ''}`}
        >
          <slot name="preview-iframe" />
        </div>

        <div
          id="tab-compiled"
          class={`tab-content ${activeTab.value === 'tab-compiled' ? 'active' : ''}`}
        >
          <textarea disabled>{code.value}</textarea>
        </div>
      </div>
    </section>
  );
}
