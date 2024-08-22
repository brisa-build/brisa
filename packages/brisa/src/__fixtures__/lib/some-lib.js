import { brisaElement } from 'brisa/client';

customElements.define(
  'some-lib',
  brisaElement(() => `has ${window._P.length} web context plugin`),
);
