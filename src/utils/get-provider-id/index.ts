export default function getProviderId(el: HTMLElement, id: string) {
  while (el) {
    if (el.tagName === "CONTEXT-PROVIDER" && id === el.getAttribute("cid")) {
      const pid = el.getAttribute("pid");
      if (pid) return pid;
    }

    el = (el as any).host ?? el.parentNode;
  }

  return null;
}
