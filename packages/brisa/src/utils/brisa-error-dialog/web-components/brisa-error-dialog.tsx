import type { WebContext } from "brisa";

type Error = {
  title: string;
  message: string;
  stack?: string;
};

const ERROR_STORE_KEY = "__BRISA_ERRORS__";

export default function ErrorDialog(
  {},
  { store, css, effect, state, cleanup, derived }: WebContext,
) {
  const displayDialog = state(true);
  const errors = derived(() => store.get<Error[]>(ERROR_STORE_KEY) ?? []);
  const numErrors = derived(() => errors.value?.length ?? 0);
  const currentIndex = state(0);

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
    }

    nav button {
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
      min-width: 300px;
      max-width: 80%;
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

  effect(() => {
    if (!numErrors.value) return;
    if (!displayDialog.value) return;

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && currentIndex.value > 0) {
        currentIndex.value -= 1;
      } else if (
        e.key === "ArrowRight" &&
        currentIndex.value < numErrors.value - 1
      ) {
        currentIndex.value += 1;
      }
    }

    document.addEventListener("keydown", onKeydown);
    document.body.style.overflow = "hidden";
    currentIndex.value = 0;

    cleanup(() => document.removeEventListener("keydown", onKeydown));
    cleanup(() => {
      document.body.style.overflow = "auto";
    });
  });

  function onClose() {
    displayDialog.value = false;
  }

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
          {errors.value[currentIndex.value].title}:{" "}
          {errors.value[currentIndex.value].message}
        </p>
        <button class="close-dialog" onClick={onClose}>
          Close
        </button>
      </div>
    </dialog>
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
