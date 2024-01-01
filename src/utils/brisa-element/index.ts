import { WebContext, BrisaContext } from "../../types";
import getProviderId from "../get-provider-id";
import { deserialize, serialize } from "../serialization";
import signals from "../signals";
import stylePropsToString, { lowercase } from "../style-props-to-string";

type Attr = Record<string, unknown>;
type StateSignal = { value: unknown };
type Props = Record<string, unknown>;
type ReactiveArray = [string, Attr, Children];
type Render = {
  (props: Props, webContext: WebContext): Children;
  suspense?(props: Props, webContext: WebContext): Children;
  error?(props: Props, webContext: WebContext): Children;
};

type Children =
  | unknown[]
  | string
  | (() => Children)
  | Promise<Children>
  | { type: string; props: any };
type Event = (e: unknown) => void;

export const _on = Symbol("on");
export const _off = Symbol("off");

const W3 = "http://www.w3.org/";
const SVG_NAMESPACE = W3 + "2000/svg";
const XLINK_NAMESPACE = W3 + "1999/xlink";
const HTML = "HTML";
const PORTAL = "portal";
const SLOT_TAG = "slot";
const KEY = "key";
const CONNECTED_CALLBACK = "connectedCallback";
const DISCONNECTED_CALLBACK = "dis" + CONNECTED_CALLBACK;
const INNER_HTML = "inner" + HTML;
const PROPS: "p" = "p";
const SUSPENSE_PROPS = "l";
const NULL = null;
const CONTEXT = "context";

const createTextNode = (text: Children) => {
  if ((text as any) === false) text = "";
  return document.createTextNode(
    (Array.isArray(text) ? text.join("") : text ?? "").toString(),
  );
};

const isObject = (o: unknown) => typeof o === "object";
const isReactiveArray = (a: any) => a?.some?.(isObject);
const arr = Array.from;
const isFunction = (fn: unknown) => typeof fn === "function";
const isAttributeAnEvent = (key: string) => key.startsWith("on");
const appendChild = (parent: HTMLElement | DocumentFragment, child: Node) =>
  parent.appendChild(child);

const createElement = (
  tagName: string,
  parent?: HTMLElement | DocumentFragment,
) => {
  return tagName === "svg" ||
    ((parent as HTMLElement)?.namespaceURI === SVG_NAMESPACE &&
      lowercase((parent as HTMLElement).tagName) !== "foreignobject")
    ? document.createElementNS(SVG_NAMESPACE, tagName)
    : document.createElement(tagName);
};

const setAttribute = (el: HTMLElement, key: string, value: string) => {
  const on = (value as unknown as symbol) === _on;
  const off = (value as unknown as symbol) === _off;
  const isStyleObj = key === "style" && isObject(value);
  const serializedValue = isStyleObj
    ? stylePropsToString(value as JSX.CSSProperties)
    : serialize(value);

  const isWithNamespace =
    el.namespaceURI === SVG_NAMESPACE &&
    (key.startsWith("xlink:") || key === "href");

  if (key === "ref") {
    (value as unknown as StateSignal).value = el;
  } else if (isWithNamespace) {
    if (off) el.removeAttributeNS(XLINK_NAMESPACE, key);
    else el.setAttributeNS(XLINK_NAMESPACE, key, on ? "" : serializedValue);
  } else {
    if (off) el.removeAttribute(key);
    else el.setAttribute(key, on ? "" : serializedValue);
  }
};

export default function brisaElement(
  render: Render,
  observedAttributes: string[] = [],
) {
  const attributesLowercase: string[] = [];
  const attributesObj: Record<string, string> = {};

  observedAttributes.push(KEY);

  for (let attr of observedAttributes) {
    const lowercaseAttr = lowercase(attr);
    attributesObj[lowercaseAttr] = attributesObj[attr] = attr;
    attributesLowercase.push(lowercaseAttr);
  }

  return class extends HTMLElement {
    p: Record<string, StateSignal | Event> | undefined;
    s: ReturnType<typeof signals> | undefined;

    static get observedAttributes() {
      return attributesLowercase;
    }

    async [CONNECTED_CALLBACK]() {
      const self = this;
      const shadowRoot = self.shadowRoot ?? self.attachShadow({ mode: "open" });
      const fnToExecuteAfterMount: (() => void)[] = [];
      let cssStyle = "";

      function handlePortal(
        children: Children,
        parent: HTMLElement | DocumentFragment,
      ) {
        if ((children as any)?.type !== PORTAL) return [children, parent];
        const { element, target } = (children as any).props;
        return [element, target];
      }

      async function mount(
        tagName: string | null,
        attributes: Attr,
        children: Children,
        parent: HTMLElement | DocumentFragment,
        // r: function to register subeffects to then clean them up
        r: (v: any) => any,
        effect: (v: any) => any,
        initialRender = false,
      ) {
        // Handle promises
        if ((children as Promise<Children>)?.then) {
          children = await (children as any);
        }

        if (initialRender) {
          // Reset innerHTML when using shadowRoot
          if (self.shadowRoot) {
            (self.shadowRoot as any)[INNER_HTML] = "";
          }
          // Handle CSS
          if (cssStyle) {
            const style = createElement("style");
            style.textContent = cssStyle;
            appendChild(shadowRoot, style);
          }
        }

        // Handle portal
        [children, parent] = handlePortal(children, parent);

        let el = (
          tagName ? createElement(tagName, parent) : parent
        ) as HTMLElement;

        // Handle attributes
        for (let [attribute, attrValue] of Object.entries(attributes)) {
          const isEvent = isAttributeAnEvent(attribute);

          if (isEvent) {
            el.addEventListener(lowercase(attribute.slice(2)), (e) =>
              (attrValue as (detail: unknown) => EventListener)(
                (e as CustomEvent)?.detail ?? e,
              ),
            );
          } else if (!isEvent && isFunction(attrValue)) {
            effect(r(() => setAttribute(el, attribute, (attrValue as any)())));
          } else {
            setAttribute(el, attribute, attrValue as string);
          }
        }

        // Handle children
        if ((children as any)?.type === HTML) {
          (el as any)[INNER_HTML] += (children as any).props.html as string;
        } else if (children === SLOT_TAG) {
          appendChild(el, createElement(SLOT_TAG));
        } else if (isReactiveArray(children)) {
          if (isReactiveArray((children as any)[0])) {
            for (let child of children as Children[]) {
              mount(NULL, {}, child, el, r, effect);
            }
          } else {
            mount(...(children as [string, Attr, Children]), el, r, effect);
          }
        } else if (isFunction(children)) {
          let lastNodes: ChildNode[] | undefined;

          const insertOrUpdate = (element: ChildNode | DocumentFragment) => {
            if (lastNodes && el.contains(lastNodes[0])) {
              el.insertBefore(element, lastNodes[0]);
              for (let node of lastNodes) node?.remove();
            } else appendChild(el, element);
          };

          effect(
            r((r2: any) => {
              const childOrPromise = (children as any)();

              function startEffect(child: Children) {
                [child, el] = handlePortal(child, el);

                const isDangerHTML = (child as any)?.type === HTML;

                if (isDangerHTML || isReactiveArray(child)) {
                  let currentElNodes = arr(el.childNodes);
                  const fragment = document.createDocumentFragment();

                  // Reactive injected danger HTML via dangerHTML() helper
                  if (isDangerHTML) {
                    const p = createElement("p");
                    (p as any)[INNER_HTML] += (child as any).props
                      .html as string;

                    for (let node of arr(p.childNodes)) {
                      appendChild(fragment, node);
                    }
                  }
                  // Reactive child node
                  else if (isReactiveArray((child as Children[])[0])) {
                    for (let c of child as Children[]) {
                      mount(NULL, {}, c, fragment, r(r2), effect);
                    }
                  } else if ((child as ReactiveArray).length) {
                    mount(...(child as ReactiveArray), fragment, r(r2), effect);
                  }
                  insertOrUpdate(fragment);

                  lastNodes = arr(el.childNodes).filter(
                    (node) => !currentElNodes.includes(node),
                  );
                }
                // Reactive text node
                else {
                  const textNode = createTextNode(child);

                  insertOrUpdate(textNode);

                  lastNodes = [textNode];
                }
              }
              if (childOrPromise instanceof Promise)
                childOrPromise.then(startEffect);
              else startEffect(childOrPromise);
            }),
          );
        } else {
          appendChild(el, createTextNode(children));
        }

        if (tagName) appendChild(parent, el);
      }

      const startRender = (
        fn: Render,
        extraProps?: { [key: string]: unknown } | null,
        renderSignals = signals(),
        propsField = PROPS,
      ) => {
        // Save signals to reset them later in the disconnectedCallback
        self.s = renderSignals;

        // Attributes (events and props)
        self[propsField] = {};
        for (let attr of observedAttributes) {
          self[propsField]![attributesObj[attr]] = isAttributeAnEvent(attr)
            ? self.e(attr)
            : renderSignals.state(deserialize(self.getAttribute(attr)));
        }
        const props = {
          children: [SLOT_TAG, {}, NULL],
          ...self[propsField],
          ...extraProps,
        };

        // Web context
        const webContext = {
          ...renderSignals,
          onMount(cb: () => void) {
            fnToExecuteAfterMount.push(cb);
          },
          // Context
          useContext<T>(context: BrisaContext<T>) {
            const pId = getProviderId(self, context.id);

            if (pId) {
              const id = `${CONTEXT}:${context.id}:${pId}`;
              return renderSignals.derived(() => renderSignals.store.get(id));
            }

            return renderSignals.state(context.defaultValue);
          },
          // Handle CSS
          css(strings: string[], ...values: string[]) {
            cssStyle += strings[0] + values.join("");
          },
          self,
        } as unknown as WebContext;

        cssStyle = "";
        return mount(
          NULL,
          {},
          fn(props, webContext),
          shadowRoot,
          (v: any) => v,
          renderSignals.effect,
          true,
        );
      };

      let suspenseSignals = signals();

      // Render the component
      try {
        // Handle suspense
        if (isFunction(render.suspense)) {
          await startRender(
            render.suspense!,
            NULL,
            suspenseSignals,
            SUSPENSE_PROPS as "p",
          );
        }
        // Handle render
        await startRender(render);
        suspenseSignals.reset();
        delete self[SUSPENSE_PROPS as "p"];
      } catch (e) {
        // Handle error
        suspenseSignals.reset();
        self.s!.reset();
        if (isFunction(render.error)) {
          startRender(render.error!, { error: self.s!.state(e) });
        } else throw e;
      }
      for (const fn of fnToExecuteAfterMount) fn();
    }

    // Reset all: call cleanup, remove effects, subeffects, cleanups, etc
    [DISCONNECTED_CALLBACK]() {
      this.s?.reset();
    }

    // Handle events
    e(attribute: string) {
      return (e: any) => {
        const ev = new CustomEvent(lowercase(attribute.slice(2)), {
          detail: e?.detail ?? e,
        });
        this.dispatchEvent(ev);
      };
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null,
    ) {
      const self = this as any;
      const propsField = self[SUSPENSE_PROPS] ? SUSPENSE_PROPS : PROPS;

      // unmount + mount again when the key changes
      if (name === KEY && oldValue != NULL && oldValue !== newValue) {
        self[DISCONNECTED_CALLBACK]();
        self[CONNECTED_CALLBACK]();
      }
      // Handle component props
      if (
        self[propsField] &&
        oldValue !== newValue &&
        !isAttributeAnEvent(name)
      ) {
        (self[propsField][attributesObj[name]] as StateSignal).value =
          deserialize(newValue);
      }
    }
  };
}
