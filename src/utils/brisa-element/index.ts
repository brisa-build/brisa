import signals from "../signals";

type Attr = Record<string, unknown>;
type Render = (
  props: Record<string, unknown>,
  ctx: ReturnType<typeof signals> & {
    css(strings: string[], ...values: string[]): void;
    h(tagName: string, attributes: Attr, children: unknown): Node;
  },
) => Node[];

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
      const c = document.createElement.bind(document);
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
            let el = tagName ? c(tagName) : document.createDocumentFragment();

            Object.entries(attributes).forEach(([key, value]) => {
              const isEvent = key.startsWith("on");
              if (isEvent) {
                el.addEventListener(
                  key.slice(2).toLowerCase(),
                  value as EventListener,
                );
              } else if (typeof value === "function" && !isEvent) {
                ctx.effect(() =>
                  (el as HTMLElement).setAttribute(key, value()),
                );
              } else {
                (el as HTMLElement).setAttribute(key, value as string);
              }
            });

            if (children) {
              if (Array.isArray(children)) {
                children.forEach((child) => el.appendChild(child));
              } else if (typeof children === "string") {
                el.textContent = children;
              } else if (typeof children === "function") {
                ctx.effect(() => {
                  const child = children();
                  if (Array.isArray(child)) {
                    child.forEach((c) => el.appendChild(c));
                  } else el.textContent = child;
                });
              } else {
                el.appendChild(children as Node);
              }
            }

            return el;
          },
          css(strings: string[], ...values: string[]) {
            const style = c("style");
            style.textContent = strings[0] + values.join("");
            shadowRoot.appendChild(style);
          },
        },
      );
      els.forEach((el) => shadowRoot.appendChild(el));
    }

    attributeChangedCallback(
      name: string,
      oldValue: unknown,
      newValue: unknown,
    ) {
      if (!this.p || oldValue === newValue) return;
      this.p[name].value = newValue;
    }
  };
}
