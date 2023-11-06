import { deserialize, serialize } from "../serialization";
import signals from "../signals";

type Attr = Record<string, unknown>;
type StateSignal = { value: unknown };
type Render = (
  props: Record<string, unknown>,
  ctx: ReturnType<typeof signals> & {
    onMount(cb: () => void): void;
    css(strings: string[], ...values: string[]): void;
    h(tagName: string, attributes: Attr, children: unknown): void;
  },
) => Node[];
type Children = unknown[] | string | (() => Children);
type Event = (e: unknown) => void;

const W3 = "http://www.w3.org/";
const SVG_NAMESPACE = `${W3}2000/svg`;
const XLINK_NAMESPACE = `${W3}1999/xlink`;

const createTextNode = (text: string) =>
  document.createTextNode((text ?? "").toString());
const isArray = Array.isArray;
const arr = Array.from;
const lowercase = (str: string) => str.toLowerCase();

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
  const on = (value as unknown as true) === true;
  const off = (value as unknown as false | null) === false || value == null;
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
  observedAttributes: string[] = [],
) {
  const attributesLowercase: string[] = [];
  const attributesObj: Record<string, string> = {};

  for (let attr of observedAttributes) {
    const lowercaseAttr = lowercase(attr);
    attributesObj[lowercaseAttr] = attributesObj[attr] = attr;
    attributesLowercase.push(lowercaseAttr);
  }

  return class extends HTMLElement {
    p: Record<string, StateSignal | Event> | undefined;
    ctx: ReturnType<typeof signals> | undefined;

    static get observedAttributes() {
      return attributesLowercase;
    }

    async connectedCallback() {
      this.ctx = signals();
      const { state, effect } = this.ctx;
      const shadowRoot = this.attachShadow({ mode: "open" });
      const fnToExecuteAfterMount: (() => void)[] = [];

      this.p = {};

      for (let attr of observedAttributes) {
        this.p[attributesObj[attr]] = attr.startsWith("on")
          ? this.e(attr)
          : state(deserialize(this.getAttribute(attr)));
      }

      function hyperScript(
        tagName: string | null,
        attributes: Attr,
        children: Children,
        parent: HTMLElement | DocumentFragment = shadowRoot,
      ) {
        const el = (
          tagName ? createElement(tagName, parent) : parent
        ) as HTMLElement;

        // Handle attributes
        for (let [key, value] of Object.entries(attributes)) {
          const isEvent = key.startsWith("on");

          if (isEvent) {
            el.addEventListener(lowercase(key.slice(2)), (e) =>
              (value as (detail: unknown) => EventListener)(
                (e as CustomEvent)?.detail ?? e,
              ),
            );
          } else if (!isEvent && typeof value === "function") {
            effect(() => setAttribute(el, key, (value as () => string)()));
          } else {
            setAttribute(el, key, value as string);
          }
        }

        // Handle children
        if (children === "slot") {
          el.appendChild(createElement("slot"));
        } else if (isArray(children)) {
          if (isArray(children[0])) {
            for (let child of children as Children[]) {
              hyperScript(null, {}, child, el);
            }
          } else {
            hyperScript(...(children as [string, Attr, Children]), el);
          }
        } else if (typeof children === "function") {
          let lastNodes: ChildNode[] | undefined;

          const insertOrUpdate = (e: ChildNode | DocumentFragment) => {
            if (lastNodes) {
              el.insertBefore(e, lastNodes[0]);
              for (let node of lastNodes) node?.remove();
            } else el.appendChild(e);
          };

          effect(() => {
            const childOrPromise = children();

            function startEffect(child: Children) {
              if (isArray(child)) {
                let currentElNodes = arr(el.childNodes);
                const fragment = document.createDocumentFragment();

                if (isArray(child[0])) {
                  for (let c of child as Children[]) {
                    hyperScript(null, {}, c, fragment);
                  }
                } else if (child.length) {
                  hyperScript(...(child as [string, Attr, Children]), fragment);
                }

                insertOrUpdate(fragment);

                lastNodes = arr(el.childNodes).filter(
                  (node) => !currentElNodes.includes(node),
                );
              } else if ((child as unknown as boolean) !== false) {
                const textNode = createTextNode(child as string);

                insertOrUpdate(textNode);

                lastNodes = [textNode];
              }
            }
            if (childOrPromise instanceof Promise)
              childOrPromise.then(startEffect);
            else startEffect(childOrPromise);
          });
        } else if ((children as unknown as boolean) !== false) {
          el.appendChild(createTextNode(children));
        }

        if (tagName) parent.appendChild(el);
      }

      await render(
        { children: "slot", ...this.p },
        {
          ...this.ctx,
          h: hyperScript,
          onMount(cb: () => void) {
            fnToExecuteAfterMount.push(cb);
          },
          // Handle CSS
          css(strings: string[], ...values: string[]) {
            const style = createElement("style");
            style.textContent = strings[0] + values.join("");
            shadowRoot.appendChild(style);
          },
        },
      );
      for (const fn of fnToExecuteAfterMount) fn();
    }

    // Clean up signals on disconnection
    disconnectedCallback() {
      this.ctx?.cleanAll();
      delete this.ctx;
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
      // Handle component props
      if (this.p && oldValue !== newValue && !name.startsWith("on")) {
        (this.p[attributesObj[name]] as StateSignal).value =
          deserialize(newValue);
      }
    }
  };
}
