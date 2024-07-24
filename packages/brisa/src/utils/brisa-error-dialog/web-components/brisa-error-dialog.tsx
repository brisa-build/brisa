import type { WebContext } from '@/types';
import { isNavigateThrowable } from '@/utils/navigate/utils';

type Error = {
  title: string;
  details: string[];
  stack?: string;
  docLink?: string;
  docTitle?: string;
};

const ERROR_STORE_KEY = '__BRISA_ERRORS__';
const modelPromise = window.ai?.createTextSession?.();

export default function ErrorDialog(
  {},
  { store, css, effect, state, cleanup, derived, self }: WebContext,
) {
  const displayDialog = state(true);
  const loadingAIResponse = state(false);
  const aiResponse = state('');
  const errors = derived(() => store.get<Error[]>(ERROR_STORE_KEY) ?? []);
  const numErrors = derived(() => errors.value?.length ?? 0);
  const currentIndex = state(0);

  effect(() => {
    self!.shadowRoot!.adoptedStyleSheets = [];
  });

  function onClose() {
    displayDialog.value = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
      currentIndex.value -= 1;
    } else if (
      e.key === 'ArrowRight' &&
      currentIndex.value < numErrors.value - 1
    ) {
      currentIndex.value += 1;
    }
  }

  async function explainMeError() {
    try {
      const promptMsg =
        'Explain this JS error: ' +
        JSON.stringify(errors.value[currentIndex.value]);
      loadingAIResponse.value = true;
      aiResponse.value = '';
      const model = await modelPromise;
      const promise = model.prompt(promptMsg);
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
      aiResponse.value = await Promise.race([
        promise,
        sleep(5000).then(() => 'AI response timed out'),
      ]);
      loadingAIResponse.value = false;
    } catch (e) {
      aiResponse.value = 'Failed to generate AI fix proposal';
      loadingAIResponse.value = false;
    }
  }

  effect(() => {
    if (numErrors.value) {
      currentIndex.value = numErrors.value - 1;
      displayDialog.value = true;
    }
  });

  effect(() => {
    window.addEventListener('error', (e) => {
      if (isNavigateThrowable(e.error)) return;
      displayDialog.value = true;
      store.set('__BRISA_ERRORS__', [
        ...(store.get<Error[]>('__BRISA_ERRORS__') ?? []),
        {
          title: 'Uncaught Error',
          details: [e.error.message],
          stack: e.error?.stack,
        },
      ]);
    });
  });

  effect(() => {
    if (!numErrors.value || !displayDialog.value) return;

    window.addEventListener('keydown', onKeydown);
    document.body.style.overflow = 'hidden';
    aiResponse.value = '';

    cleanup(() => window.removeEventListener('keydown', onKeydown));
    cleanup(() => {
      document.body.style.overflow = 'auto';
    });
  });

  css`
    dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 10vh;
      z-index: 9000;
      box-sizing: border-box;
    }

    nav button,
    .ask-ai {
      background-color: rgba(255, 85, 85, 0.1);
      color: #f44336;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      margin: 0 2px;
      padding: 5px;
    }

    nav button:disabled {
      background-color: rgba(255, 85, 85, 0.05);
      color: #f4433655;
    }

    nav button svg {
      width: auto;
      height: auto;
    }

    .close-svg-btn {
      all: unset;
    }

    header svg {
      cursor: pointer;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      color: #999999;
      margin-bottom: 10px;
    }

    svg.close-error {
      color: #999999;
      cursor: pointer;
    }

    svg.close-error:hover {
      color: #000;
    }

    dialog > div {
      padding: 20px;
      background-color: light-dark(white, black);
      border-radius: 5px;
      border-top: 5px solid #f44336;
      min-width: 200px;
      max-width: min(80%, 900px);
    }

    h1 {
      color: #f44336;
      font-size: 1.5rem;
      align-self: center;
      padding: 0;
      margin: 0;
    }

    p {
      color: light-dark(black, white);
    }

    button.close-dialog,
    button.brisa-error-notification {
      padding: 10px 20px;
      background: #f44336;
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 5px;
      margin-left: auto;
      display: block;
    }

    button.brisa-error-notification {
      position: fixed;
      bottom: 10px;
      left: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      width: 160px;
      box-shadow: 0px 16px 32px rgba(0, 0, 0, 0.25);
    }

    button.brisa-error-notification:hover {
      scale: 1.05;
      transition: scale 0.2s;
    }

    button.brisa-error-notification svg.close-error {
      color: #ffcecd;
    }

    button.brisa-error-notification svg.close-error:hover {
      color: #ffffff;
    }
  `;

  if (!numErrors.value) return null;

  if (!displayDialog.value) {
    return (
      <button
        class="brisa-error-notification"
        onClick={() => (displayDialog.value = true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {numErrors.value} errors
        {closeElement({ onClose: () => store.set(ERROR_STORE_KEY, []) })}
      </button>
    );
  }

  return (
    <dialog open>
      <div>
        <header>
          <nav>
            {numErrors.value > 1 && (
              <>
                <button
                  onClick={() => (currentIndex.value -= 1)}
                  type="button"
                  disabled={currentIndex.value === 0}
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>previous</title>
                    <path
                      d="M6.99996 1.16666L1.16663 6.99999L6.99996 12.8333M12.8333 6.99999H1.99996H12.8333Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                </button>
                <button
                  onClick={() => (currentIndex.value += 1)}
                  type="button"
                  disabled={currentIndex.value + 1 === numErrors.value}
                >
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>next</title>
                    <path
                      d="M6.99996 1.16666L12.8333 6.99999L6.99996 12.8333M1.16663 6.99999H12H1.16663Z"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></path>
                  </svg>
                </button>
              </>
            )}
            &nbsp;{currentIndex.value + 1} of {numErrors.value} unhanded errors
          </nav>
          {closeElement({ onClose })}
        </header>
        <p>
          <b>{errors.value[currentIndex.value].title}: </b>
        </p>
        {errors.value[currentIndex.value].details?.map((message) => (
          <p>{message}</p>
        ))}
        {printStack(errors.value[currentIndex.value].stack)}
        {renderDocumentation(errors.value[currentIndex.value])}
        {modelPromise && (
          <>
            <button
              disabled={loadingAIResponse.value}
              class="ask-ai"
              style={{ width: 'auto' }}
              onClick={explainMeError}
            >
              ✨{' '}
              {loadingAIResponse.value
                ? 'Generating...'
                : 'Generate AI fix proposal'}
            </button>
          </>
        )}
        {aiResponse.value && (
          <p style={{ color: '#8d3939' }}>{aiResponse.value}</p>
        )}
        <button class="close-dialog" onClick={onClose}>
          Close
        </button>
      </div>
    </dialog>
  );
}

function renderDocumentation({ docTitle, docLink }: Error) {
  if (!docLink) return null;

  return (
    <a href={docLink} target="_blank" rel="noreferrer">
      📄 {docTitle ?? 'Documentation'}
    </a>
  );
}

function closeElement({ onClose }: { onClose: () => void }) {
  return (
    <button class="close-svg-btn" onClick={onClose}>
      <svg
        aria-label="Close"
        title="Close"
        alt="Close"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="close-error"
      >
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  );
}

function printStack(stack?: string) {
  if (!stack) return null;

  function injectStackLinks(stack: string) {
    const fileLinks: string[] = [];
    const stackLines = stack.split('\n');
    let result = stack;

    for (const line of stackLines) {
      const parts = line.split(' ');
      for (const part of parts) {
        if (
          part.includes('/') ||
          part.includes('\\') ||
          part.startsWith('http') ||
          part.startsWith('file')
        ) {
          fileLinks.push(part.replace(/[()]/g, ''));
        }
      }
    }

    for (const link of fileLinks) {
      const pathname = URL.canParse(link) ? new URL(link).pathname : link;

      const [file, line, column] = pathname.split(':');
      const finalUrl = `/__brisa_dev_file__?file=${encodeURIComponent(
        file,
      )}&line=${line}&column=${column}`;
      result = result.replace(
        link,
        `<a href="javascript:void(0);" ping="${finalUrl}">${link}</a>`,
      );
    }

    return result;
  }

  return (
    <pre style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
      {{
        type: 'HTML',
        props: {
          html: injectStackLinks(stack),
        },
      }}
    </pre>
  );
}
