/// <reference lib="dom.iterable" />

declare global {
  var u$: (idSection: string) => void;
  var l$: Set<string>;
}

l$ = new Set([]);

// window.u$: Unsuspense component
u$ = (idSection: string) => {
  l$.add(idSection);

  for (let id of l$) {
    const suspensedElement = document.getElementById(`S:${id}`);
    const ususpensedTemplate = document.getElementById(
      `U:${id}`
    ) as HTMLTemplateElement;

    if (!suspensedElement || !ususpensedTemplate) continue;

    l$.delete(id);

    suspensedElement.replaceWith(ususpensedTemplate.content.cloneNode(true));
    ususpensedTemplate.remove();
    document.getElementById(`R:${id}`)?.remove();
  }
};
