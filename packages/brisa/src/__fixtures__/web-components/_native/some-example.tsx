export default class SomeExample extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  render(name = 'World') {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML =
      '<h2>NATIVE WEB COMPONENT ' + this.getAttribute('name') + '</h2>' + name;
  }

  connectedCallback() {
    console.log('connected', this.getAttribute('name'));
  }

  disconnectedCallback() {
    console.log('disconnected');
  }

  attributeChangedCallback() {
    this.render();
  }

  adoptedCallback() {
    console.log('adopted');
  }

  static get observedAttributes() {
    return ['name'];
  }
}

export function HelloWorld(name: string) {
  return <h1>Hello {name}</h1>;
}
