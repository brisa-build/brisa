import '@spectrum-web-components/split-view/sp-split-view.js';
import type { WebContext } from 'brisa';

export default async function PlayGround(
  { defaultValue }: { defaultValue: string },
  { state, css, cleanup, onMount, self }: WebContext,
) {
  const code = state<string>('');
  const preview: HTMLIFrameElement = self.querySelector('#preview-iframe')!;
  const activeTab = state<string>('tab-wc');
  const activePanel = state<string>('panel-code');
  const isMobileLayout = state<boolean>(false);

  function updateSplitViewOrientation() {
    isMobileLayout.value = window.innerWidth <= 968;
  }

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

  function updateActivePanel(e: MouseEvent) {
    const button = e.target as HTMLButtonElement;
    const panelId = button.getAttribute('aria-label') as string;
    activePanel.value = panelId;
  }

  onMount(() => {
    // Set initial layout based on screen size
    updateSplitViewOrientation();

    window.addEventListener('message', onReceiveCompiledCode);
    window.addEventListener('resize', updateSplitViewOrientation);
  });

  cleanup(() => {
    window.removeEventListener('message', onReceiveCompiledCode);
    window.removeEventListener('resize', updateSplitViewOrientation);
  });

  css`
    .playground {
      width: 100%;
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      margin: 0;
      height: calc(100vh - 100px);
      background-color: var(--playground-bg-color);
    }

    .original-code {
      height: 100%;
    }

    .output {
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
      padding: 0.5rem;
    }

    @media (max-width: 968px) {
      .playground {
        flex-direction: column;
        gap: 0;
      }

      .active-panel {
        flex: 1 1 0%;
        width: 100%;

        div {
          width: 100%;
          height: 100%;
          padding: 0.5rem;
        }

        textarea {
          width: 100%;
          height: 100%;
          resize: none;
          field-sizing: content;
          font-size: 1rem;
          border-radius: 0.5rem;
          padding: 0.5rem;
        }
      }

      .panel-toggle {
        margin: auto;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;

        button[role="tab"] {
          flex: 1;
          height: 100%;
          border: none;
          background: none;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          border-top: 2px solid transparent;
        }

        button[role="tab"]:hover {
          background-color: var(--color-light-gray);
        }

        button[role="tab"][aria-selected="true"] {
          border-top: 2px solid var(--color-dark);
        }
      }
    }
  `;

  if (isMobileLayout.value) {
    return (
      <section class="playground">
        <div class="active-panel">
          {activePanel.value === 'panel-code' ? (
            <slot name="code-editor" />
          ) : null}
          {activePanel.value === 'panel-wc' ? (
            <slot name="preview-iframe" />
          ) : null}
          {activePanel.value === 'panel-compiled' ? (
            <div>
              <textarea disabled>{code.value}</textarea>
            </div>
          ) : null}
        </div>
        <div class="panel-toggle">
          <button
            role="tab"
            aria-label="panel-code"
            aria-selected={activePanel.value === 'panel-code'}
            onClick={updateActivePanel}
          >
            Original Code
          </button>
          <button
            role="tab"
            aria-label="panel-wc"
            aria-selected={activePanel.value === 'panel-wc'}
            onClick={updateActivePanel}
          >
            Web Component
          </button>
          <button
            role="tab"
            aria-label="panel-compiled"
            aria-selected={activePanel.value === 'panel-compiled'}
            onClick={updateActivePanel}
          >
            Compiled Code
          </button>
        </div>
      </section>
    );
  }

  return (
    <sp-split-view
      class="playground"
      resizable
      label="Resize the code sections horizontally"
    >
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
    </sp-split-view>
  );
}
