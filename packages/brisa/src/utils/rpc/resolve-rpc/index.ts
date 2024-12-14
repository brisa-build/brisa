import { loadScripts, registerCurrentScripts } from '@/utils/rpc/load-scripts';
import diff from 'diff-dom-streaming';

type RenderMode = 'native' | 'transition' | 'reactivity';

const TRANSITION_MODE = 'transition';
const COMPONENT = 'component';
const $window = window as any;
const encoder = new TextEncoder();

async function resolveRPC(
  res: Response,
  dataSet: DOMStringMap,
  args: unknown[] | RenderMode = [],
) {
  const store = $window._s;
  const mode = res.headers.get('X-Mode');
  const type = res.headers.get('X-Type');
  const target = res.headers.get('X-Target');
  const placement = res.headers.get('X-Placement')!;
  const urlToNavigate = res.headers.get('X-Navigate');
  const resetForm = res.headers.has('X-Reset');
  const componentId = res.headers.get('X-Cid') ?? dataSet?.cid;
  const transition = args === TRANSITION_MODE || mode === TRANSITION_MODE;
  const isRerenderOfComponent = type === COMPONENT;
  const sameTarget = target === COMPONENT;

  function updateStore(entries: [string, any][]) {
    // Store WITH web components signals, so we need to notify the subscribers
    // to keep the reactivity
    if (store) {
      for (const [key, value] of entries) store.set(key, value);
    }
    // Store WITHOUT web components signals
    else $window._S = entries;
  }

  // Reset form from the server action
  if (resetForm) {
    (args[0] as any).target.reset();
  }

  if (verifyBodyContentTypeOfResponse(res, 'json')) {
    updateStore(await res.json());
  }

  // Navigate to a different page
  if (urlToNavigate) {
    $window._xm = mode;
    location.assign(urlToNavigate);
  }

  // Diff HTML Stream
  else if (verifyBodyContentTypeOfResponse(res, 'html')) {
    registerCurrentScripts();

    const docStream = isRerenderOfComponent
      ? new ReadableStream({
          async start(controller) {
            let temp;
            let startText = `<!--o:${componentId}-->`;
            let endText = `<!--c:${componentId}-->`;

            if (!sameTarget) {
              const elm = document.querySelector(target!);
              const isReplace = placement[0] === 'r';

              // append / prepend / before / after (no "replace").
              if (elm && !isReplace) {
                temp = document.createElement(COMPONENT);
                elm[placement as 'append'](temp);
              }

              // Modify the text of the element reference.
              if (elm) {
                startText = endText = (isReplace ? elm : temp)!.outerHTML;
              }
            }

            const html = document.documentElement.outerHTML;
            controller.enqueue(encoder.encode(html.split(startText)[0]));
            const reader = res.body!.getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.enqueue(encoder.encode(html.split(endText)[1]));
            controller.close();
          },
        })
      : res.body;

    await diff(document, docStream!, {
      onNextNode: loadScripts,
      transition,
      shouldIgnoreNode: (node) => {
        if ((node as Element)?.id !== 'S') return false;
        updateStore(JSON.parse((node as Element).textContent!));
        return true;
      },
    });

    await $window.lastDiffTransition?.finished;
  }
}

$window._rpc = resolveRPC;

function verifyBodyContentTypeOfResponse(res: Response, contentType: string) {
  return res.body && res.headers.get('content-type')?.includes(contentType);
}
