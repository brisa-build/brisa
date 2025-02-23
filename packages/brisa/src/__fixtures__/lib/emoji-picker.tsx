class EmojiPicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="emoji-picker">
        <button>😀</button>
        <button>😂</button>
        <button>😍</button>
        <button>😎</button>
        <button>😜</button>
        <button>😡</button>
      </div>
    `;
  }
}

customElements.define('emoji-picker', EmojiPicker);
