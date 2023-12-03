import { deserialize, serialize } from "../serialization";
import signals from "../signals";

type Attr = Record<string, unknown>;
type StateSignal = { value: unknown };
type Render = (
  props: Record<string, unknown>,
  s: ReturnType<typeof signals> & {
    onMount(cb: () => void): void;
    css(strings: string[], ...values: string[]): void;
    h(tagName: string, attributes: Attr, children: unknown): void;
  }
) => Node[];
type Children = unknown[] | string | (() => Children);
type Event = (e: unknown) => void;

export const _on = Symbol("on");
export const _off = Symbol("off");

const W3 = "http://www.w3.org/";
const SVG_NAMESPACE = `${W3}2000/svg`;
const XLINK_NAMESPACE = `${W3}1999/xlink`;
const DANGER_HTML = "danger-html";
const PORTAL = "portal";
const SLOT_TAG = "slot";
const KEY = "key";
const CONNECTED_CALLBACK = "connectedCallback";
const DISCONNECTED_CALLBACK = "disconnectedCallback";

const createTextNode = (text: Children) => {
  if ((text as any) === false) text = "";
  return document.createTextNode(
    (Array.isArray(text) ? text.join("") : text ?? "").toString()
  );
};

const isReactiveArray = (a: any) =>
  a?.some?.((v: unknown) => typeof v === "object");
const arr = Array.from;
const isFunction = (fn: unknown) => typeof fn === "function";
const lowercase = (str: string) => str.toLowerCase();
const isAttributeAnEvent = (key: string) => key.startsWith("on");
const appendChild = (parent: HTMLElement | DocumentFragment, child: Node) =>
  parent.appendChild(child);

const createElement = (
  tagName: string,
  parent?: HTMLElement | DocumentFragment
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
  const serializedValue = serialize(value);
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
  observedAttributes: string[] = []
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
      self.s = signals();
      const { state, effect } = self.s;
      const shadowRoot = self.shadowRoot ?? self.attachShadow({ mode: "open" });
      const fnToExecuteAfterMount: (() => void)[] = [];

      self.p = {};

      for (let attr of observedAttributes) {
        self.p[attributesObj[attr]] = isAttributeAnEvent(attr)
          ? self.e(attr)
          : state(deserialize(self.getAttribute(attr)));
      }

      function handlePortal(
        children: Children,
        parent: HTMLElement | DocumentFragment
      ) {
        if ((children as any)?.type !== PORTAL) return [children, parent];
        const { element, target } = (children as any).props;
        return [element, target];
      }

      function hyperScript(
        tagName: string | null,
        attributes: Attr,
        children: Children,
        parent: HTMLElement | DocumentFragment = shadowRoot,
        // r: function to register subeffects to then clean them up
        r = (v: any) => v
      ) {
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
                (e as CustomEvent)?.detail ?? e
              )
            );
          } else if (!isEvent && isFunction(attrValue)) {
            effect(r(() => setAttribute(el, attribute, (attrValue as any)())));
          } else {
            setAttribute(el, attribute, attrValue as string);
          }
        }

        // Handle children
        if ((children as any)?.type === DANGER_HTML) {
          el.innerHTML += (children as any).props.html as string;
        } else if (children === SLOT_TAG) {
          appendChild(el, createElement(SLOT_TAG));
        } else if (isReactiveArray(children)) {
          if (isReactiveArray((children as any)[0])) {
            for (let child of children as Children[]) {
              hyperScript(null, {}, child, el, r);
            }
          } else {
            hyperScript(...(children as [string, Attr, Children]), el, r);
          }
        } else if (isFunction(children)) {
          let lastNodes: ChildNode[] | undefined;

          const insertOrUpdate = (
            element: (ChildNode | DocumentFragment)[]
          ) => {
            if (lastNodes && el.contains(lastNodes[0])) {
              for (let e of element) el.insertBefore(e, lastNodes[0]);
              for (let node of lastNodes) node?.remove();
            } else for (let e of element) appendChild(el, e);
          };

          effect(
            r((r2: any) => {
              const childOrPromise = (children as any)();

              function startEffect(child: Children) {
                [child, el] = handlePortal(child, el);

                const isDangerHTML = (child as any)?.type === DANGER_HTML;

                if (isDangerHTML || isReactiveArray(child)) {
                  let currentElNodes = arr(el.childNodes);
                  const fragment = document.createDocumentFragment();

                  // Reactive injected danger HTML via dangerHTML() helper
                  if (isDangerHTML) {
                    const div = createElement("div");
                    div.innerHTML += (child as any).props.html as string;

                    for (let node of arr(div.childNodes)) {
                      appendChild(fragment, node);
                    }
                  }
                  // Reactive child node
                  else if (isReactiveArray((child as any[])[0])) {
                    for (let c of child as Children[]) {
                      hyperScript(null, {}, c, fragment, r(r2));
                    }
                  } else if (child.length) {
                    hyperScript(
                      ...(child as [string, Attr, Children]),
                      fragment,
                      r(r2)
                    );
                  }

                  insertOrUpdate([fragment]);

                  lastNodes = arr(el.childNodes).filter(
                    (node) => !currentElNodes.includes(node)
                  );
                }
                // Reactive text node
                else {
                  const textNode = createTextNode(child);

                  insertOrUpdate([textNode]);

                  lastNodes = [textNode];
                }
              }
              if (childOrPromise instanceof Promise)
                childOrPromise.then(startEffect);
              else startEffect(childOrPromise);
            })
          );
        } else {
          appendChild(el, createTextNode(children));
        }

        if (tagName) appendChild(parent, el);
      }

      await render(
        { children: SLOT_TAG, ...self.p },
        {
          ...self.s,
          h: hyperScript,
          onMount(cb: () => void) {
            fnToExecuteAfterMount.push(cb);
          },
          // Handle CSS
          css(strings: string[], ...values: string[]) {
            const style = createElement("style");
            style.textContent = strings[0] + values.join("");
            appendChild(shadowRoot, style);
          },
        }
      );
      for (const fn of fnToExecuteAfterMount) fn();
    }

    // Clean up signals on disconnection
    [DISCONNECTED_CALLBACK]() {
      const self = this;
      self.shadowRoot!.innerHTML = "";
      self.s?.cleanAll();
      delete self.s;
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
      newValue: string | null
    ) {
      const self = this;

      // unmount + mount again when the key changes
      if (name === KEY && oldValue != null && oldValue !== newValue) {
        self[DISCONNECTED_CALLBACK]();
        self[CONNECTED_CALLBACK]();
      }
      // Handle component props
      if (self.p && oldValue !== newValue && !isAttributeAnEvent(name)) {
        (self.p[attributesObj[name]] as StateSignal).value =
          deserialize(newValue);
      }
    }
  };
}
