import signals from "../signals";

type Attr = Record<string, unknown>;
type Render = (
  props: Record<string, unknown>,
  ctx: ReturnType<typeof signals> & {
    css(strings: string[], ...values: string[]): void;
    h(tagName: string, attributes: Attr, children: unknown): Node;
  },
) => Node[];

const c = document.createElement.bind(document);
const f = document.createDocumentFragment.bind(document);

export default function brisaElement(
  render: Render,
  observedAttributes: string[] = [],
) {
  return class extends HTMLElement {
    p: Record<string, { value: unknown }> | undefined;

    static get observedAttributes() {
      return observedAttributes;
    }

    connectedCallback() {
      const ctx = signals();
      this.p = {};

      for (let attr of observedAttributes) {
        this.p[attr] = ctx.state(this.getAttribute(attr));
      }

      const shadowRoot = this.attachShadow({ mode: "open" });
      const els = render(
        { children: c("slot"), ...this.p },
        {
          ...ctx,
          h(tagName: string, attributes: Attr, children: unknown) {
            const fragment = f();
            let el: Node = tagName ? c(tagName) : f();

            // Handle attributes
            Object.entries(attributes).forEach(([key, value]) => {
              const isEvent = key.startsWith("on");

              if (isEvent) {
                el.addEventListener(
                  key.slice(2).toLowerCase(),
                  value as EventListener,
                );
              } else if (!isEvent && typeof value === "function") {
                ctx.effect(() =>
                  (el as HTMLElement).setAttribute(key, value()),
                );
              } else {
                (el as HTMLElement).setAttribute(key, value as string);
              }
            });

            if (!children) return el;

            // Handle children
            if (Array.isArray(children)) {
              children.forEach((child) => fragment.appendChild(child));
              el.appendChild(fragment);
            } else if (typeof children === "string") {
              el.textContent = children;
            } else if (typeof children === "function") {
              ctx.effect(() => {
                const child = children();

                if (Array.isArray(child)) {
                  child.forEach((c) => fragment.appendChild(c));

                  (el as HTMLElement).innerHTML = "";
                  el.appendChild(fragment);
                } else {
                  el.textContent = child;
                }
              });
            } else {
              el.appendChild(children as Node);
            }

            return el;
          },
          // Handle CSS
          css(strings: string[], ...values: string[]) {
            const style = c("style");
            style.textContent = strings[0] + values.join("");
            shadowRoot.appendChild(style);
          },
        },
      );
      const fragment = f();
      els.forEach((el) => fragment.appendChild(el));
      shadowRoot.appendChild(fragment);
    }

    attributeChangedCallback(
      name: string,
      oldValue: unknown,
      newValue: unknown,
    ) {
      // Handle component props
      if (!this.p || oldValue === newValue) return;
      this.p[name].value = newValue;
    }
  };
}
