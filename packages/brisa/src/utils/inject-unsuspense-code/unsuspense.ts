/// <reference lib="dom.iterable" />

declare global {
  var u$: (idSection: string) => void;
  var l$: Set<string>;
}

l$ = new Set();

// window.u$: Unsuspense component
u$ = (idSection: string) => {
  const byId = (id: string) => document.getElementById(id);

  l$.add(idSection);

  for (const id of l$) {
    const suspensedElement = byId(`S:${id}`);
    const ususpensedTemplate = byId(`U:${id}`) as HTMLTemplateElement;

    if (suspensedElement && ususpensedTemplate) {
      l$.delete(id);

      suspensedElement.replaceWith(ususpensedTemplate.content.cloneNode(true));
      ususpensedTemplate.remove();
      byId(`R:${id}`)?.remove();
    }
  }
};
