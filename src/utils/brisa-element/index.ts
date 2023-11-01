import signals from "../signals";

type Attr = Record<string, unknown>;
type StateSignal = { value: unknown };
type Render = (
  props: Record<string, unknown>,
  ctx: ReturnType<typeof signals> & {
    css(strings: string[], ...values: string[]): void;
    h(tagName: string, attributes: Attr, children: unknown): void;
  },
) => Node[];
type Children = unknown[] | string | (() => Children);
type Event = (e: unknown) => void;

const createElement = document.createElement.bind(document);
const createTextNode = document.createTextNode.bind(document);
const isArray = Array.isArray;
const arr = Array.from;

export default function brisaElement(
  render: Render,
  observedAttributes: string[] = [],
) {
  return class extends HTMLElement {
    p: Record<string, StateSignal | Event> | undefined;
    ctx: ReturnType<typeof signals> | undefined;

    static get observedAttributes() {
      return observedAttributes;
    }

    connectedCallback() {
      this.ctx = signals();
      const { state, effect } = this.ctx;
      const shadowRoot = this.attachShadow({ mode: "open" });

      this.p = {};

      for (let attr of observedAttributes) {
        this.p[attr] = attr.startsWith("on")
          ? this.e(attr)
          : state(deserialize(this.getAttribute(attr)));
      }

      function hyperScript(
        tagName: string | null,
        attributes: Attr,
        children: Children,
        parent: HTMLElement | DocumentFragment = shadowRoot,
      ) {
        const el = (tagName ? createElement(tagName) : parent) as HTMLElement;

        // Handle attributes
        for (let [key, value] of Object.entries(attributes)) {
          const isEvent = key.startsWith("on");

          if (isEvent) {
            el.addEventListener(key.slice(2).toLowerCase(), (e) =>
              (value as (detail: unknown) => EventListener)(
                (e as CustomEvent)?.detail ?? e,
              ),
            );
          } else if (!isEvent && typeof value === "function") {
            effect(() => el.setAttribute(key, (value as () => string)()));
          } else {
            (el as HTMLElement).setAttribute(key, value as string);
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
            const child = children();

            if (isArray(child)) {
              let currentElNodes = arr(el.childNodes);
              const fragment = document.createDocumentFragment();

              if (isArray(child[0])) {
                for (let c of child as Children[]) {
                  hyperScript(null, {}, c, fragment);
                }
              } else {
                hyperScript(...(child as [string, Attr, Children]), fragment);
              }

              insertOrUpdate(fragment);

              lastNodes = arr(el.childNodes).filter(
                (node) => !currentElNodes.includes(node),
              );
            } else {
              const textNode = createTextNode(child.toString());

              insertOrUpdate(textNode);

              lastNodes = [textNode];
            }
          });
        } else {
          el.appendChild(createTextNode(children));
        }

        if (tagName) parent.appendChild(el);
      }

      render(
        { children: "slot", ...this.p },
        {
          ...this.ctx,
          h: hyperScript,
          // Handle CSS
          css(strings: string[], ...values: string[]) {
            const style = createElement("style");
            style.textContent = strings[0] + values.join("");
            shadowRoot.appendChild(style);
          },
        },
      );
    }

    // Clean up signals on disconnection
    disconnectedCallback() {
      this.ctx?.cleanAll();
      delete this.ctx;
    }

    // Handle events
    e(attribute: string) {
      return (e: any) => {
        const ev = new CustomEvent(attribute.slice(2).toLowerCase(), {
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
      if (!this.p || oldValue === newValue) return;
      if (!name.startsWith("on")) {
        (this.p[name] as StateSignal).value = deserialize(newValue);
      }
    }
  };
}

function deserialize(str: string | null): unknown {
  if (!str) return "";
  try {
    return JSON.parse(str.replaceAll("'", '"'));
  } catch (e) {
    return str;
  }
}
