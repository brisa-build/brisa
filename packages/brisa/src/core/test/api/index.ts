import { getServeOptions } from '@/cli/serve/serve-options';
import renderToString from '@/utils/render-to-string';
import { blueLog, greenLog, cyanLog } from '@/utils/log/log-color';
import { registerActions } from '@/utils/rpc/register-actions';
import { getConstants } from '@/constants';
import extendRequestContext from '@/utils/extend-request-context';
import translateCore from '@/utils/translate-core';

/**
 * Render a JSX element, a string or a Response object into a container
 */
export async function render(
  element: JSX.Element | Response | string,
  {
    locale,
    baseElement = document.documentElement,
  }: { locale?: string; baseElement?: HTMLElement } = {},
) {
  const { I18N_CONFIG } = getConstants();
  const lang = locale ?? I18N_CONFIG?.defaultLocale;
  let request = new Request('http://localhost');
  let container = baseElement;
  let htmlString;

  if (window.i18n && lang) {
    const i18n = {
      ...I18N_CONFIG,
      t: translateCore(lang, I18N_CONFIG),
      locale: lang,
      overrideMessages(callback: any) {
        const messages = I18N_CONFIG.messages?.[lang] ?? {};
        const promise = callback(messages);
        const res = (extendedMessages: Record<string, string>) =>
          Object.assign(messages, extendedMessages);
        return promise.then?.(res) ?? res(promise);
      },
    } as any;

    request = extendRequestContext({
      originalRequest: request,
      i18n,
    });
    window.i18n = i18n;
  }

  if (typeof element === 'string') {
    htmlString = element;
  } else if (element instanceof Response) {
    htmlString = await element.text();
  } else {
    container = baseElement.appendChild(document.createElement('div'));
    globalThis.REGISTERED_ACTIONS = [];
    globalThis.FORCE_SUSPENSE_DEFAULT = false;
    htmlString = await renderToString(element, { request });
    globalThis.FORCE_SUSPENSE_DEFAULT = undefined;
  }

  container.innerHTML = htmlString;

  const unmount = () => {
    container.innerHTML = '';
  };

  // Register Server Actions
  if (globalThis.REGISTERED_ACTIONS?.length) {
    registerActions(
      (
        actionId: string,
        isFormData: boolean,
        indicator: string | undefined,
        dataSet: DOMStringMap,
        ...args: unknown[]
      ) => {
        if (isFormData && args[0]) {
          // @ts-ignore
          args[0].formData = new FormData(args[0].target);
        }
        globalThis.REGISTERED_ACTIONS[+actionId](...args);
      },
    );
  }

  return { container, unmount, store: window._s };
}

export function cleanup() {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  globalThis.REGISTERED_ACTIONS = [];
}

/**
 * Serve a route and return the response
 */
export async function serveRoute(route: string) {
  const serveOptions = await getServeOptions();

  if (!serveOptions) {
    throw new Error(
      "Error: Unable to execute 'serveRoute'. Prior execution of 'brisa build' is required to utilize the 'serveRoute' method.",
    );
  }

  const url = new URL(route, 'http://localhost:3000');
  const request = new Request(url);

  globalThis.FORCE_SUSPENSE_DEFAULT = false;
  const response = await (serveOptions as any).fetch(request, {
    requestIP: () => {},
    upgrade: () => false,
  });
  globalThis.FORCE_SUSPENSE_DEFAULT = undefined;

  return response;
}

export async function waitFor(fn: () => unknown, maxMilliseconds = 1000) {
  try {
    fn();
  } catch (error) {
    await Bun.sleep(10);
    if (maxMilliseconds === 0) {
      throw error;
    }
    return waitFor(fn, maxMilliseconds - 10);
  }
}

/**
 * Debug the current DOM
 */
export function debug(
  element: HTMLElement | DocumentFragment | ShadowRoot | null = document.documentElement,
) {
  console.log(element ? prettyDOM(element) : blueLog('<>\n</>'));
}

function prettyDOM(element: HTMLElement | DocumentFragment | ShadowRoot, prefix = ''): any {
  const isAnElement = isElement(element);
  const nextPrefix = !prefix && !isAnElement ? '' : prefix + '  ';
  const separator = nextPrefix ? '\n' : '';
  const lines = [];

  if (isAnElement) {
    const attrs = element.attributes;
    lines.push(prefix, blueLog('<' + element.localName));

    for (let i = 0; i < attrs.length; i += 1) {
      const attr = attrs[i];
      lines.push(
        separator,
        prefix,
        '    ',
        cyanLog(attr.name),
        `=${greenLog('"' + attr.value + '"')}`,
      );
    }

    lines.push(blueLog('>'));
  }
  let child = isTemplate(element) ? element.content.firstChild : element.firstChild;

  while (child) {
    if (isElement(child)) {
      lines.push(separator, prettyDOM(child, nextPrefix));
    } else {
      lines.push(separator, prefix + '  ', child.textContent);
    }
    child = child.nextSibling;
  }

  if (isAnElement) {
    lines.push(separator, prefix, blueLog(`</${element.localName}>`));
  }
  return lines.join('');
}

function isElement(value: any): value is HTMLElement {
  return value && typeof value.nodeType === 'number' && value.nodeType === 1;
}

function isTemplate(node: Node | null | undefined): node is HTMLTemplateElement {
  return (node as Element)?.tagName === 'TEMPLATE';
}

/**
 * User events
 */
export const userEvent = {
  click: (element: Element) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },
  submit: (form: HTMLFormElement) => {
    form.dispatchEvent(new MouseEvent('submit', { bubbles: true }));
  },
  dblClick: (element: Element) => {
    element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  },
  type: (element: HTMLInputElement, text: string) => {
    for (const char of text) {
      element.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      element.dispatchEvent(new KeyboardEvent('keypress', { key: char }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      element.value += char;
      element.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  },
  keyboard: (key: string, element?: HTMLElement) => {
    (element ?? window).dispatchEvent(new KeyboardEvent('keydown', { key }));
    (element ?? window).dispatchEvent(new KeyboardEvent('keypress', { key }));
    (element ?? window).dispatchEvent(new KeyboardEvent('keyup', { key }));
  },
  clear: (element: HTMLInputElement) => {
    element.dispatchEvent(new KeyboardEvent('keydown', { key: '' }));
    element.dispatchEvent(new KeyboardEvent('keypress', { key: '' }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key: '' }));
    element.value = '';
    element.dispatchEvent(new InputEvent('input', { bubbles: true }));
  },
  hover: (element: Element) => {
    element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  },
  unhover: (element: Element) => {
    element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
  },
  focus: (element: Element) => {
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
  },
  blur: (element: Element) => {
    element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  },
  select: (select: HTMLSelectElement, value: string) => {
    select.value = value;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
  },
  deselect: (selecgt: HTMLSelectElement, value: string) => {
    if (value === selecgt.value) {
      selecgt.value = '';
    }
    selecgt.dispatchEvent(new Event('input', { bubbles: true }));
    selecgt.dispatchEvent(new Event('change', { bubbles: true }));
  },
  upload: (input: HTMLInputElement, file: File) => {
    // @ts-ignore
    input.files = [file];
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
  tab: ({ shift = false } = {}) => {
    const focusableElements = document.querySelectorAll(
      'input, button, select, textarea, a[href], [tabindex]',
    );
    const list = Array.prototype.filter
      .call(focusableElements, (item) => item.getAttribute('tabindex') !== '-1')
      .sort((a, b) => {
        const tabIndexA = a.getAttribute('tabindex');
        const tabIndexB = b.getAttribute('tabindex');
        return tabIndexA < tabIndexB ? -1 : tabIndexA > tabIndexB ? 1 : 0;
      });
    const index = list.indexOf(document.activeElement);

    const nextIndex = shift ? index - 1 : index + 1;
    const defaultIndex = shift ? list.length - 1 : 0;

    const next = list[nextIndex] || list[defaultIndex];
    if (next) next.focus();
  },
  paste: (element: HTMLInputElement, text: string) => {
    element.value = text;
    element.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: {
          getData: () => text,
        },
      } as any),
    );
  },
};
