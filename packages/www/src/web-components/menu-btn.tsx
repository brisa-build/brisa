import type { WebContext } from 'brisa';

export default function SideBarBtn(
  { selector, useOverlay }: { selector: string; useOverlay?: boolean },
  { effect, cleanup, self }: WebContext,
) {
  function onClickDocument(e: MouseEvent) {
    const sidebarEl = document.querySelector(selector)!;

    if (
      (e.target as HTMLElement).tagName === 'A' ||
      (sidebarEl.classList.contains('open') &&
        !sidebarEl.contains(e.target as Node))
    ) {
      close(sidebarEl);
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;

    const sidebarEl = document.querySelector(selector);

    if (sidebarEl?.classList.contains('open')) close(sidebarEl);
  }

  function onToggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sidebarEl = document.querySelector(selector)!;
    sidebarEl?.classList.toggle('open');

    if (sidebarEl?.classList.contains('open')) {
      open(sidebarEl);
    } else {
      close(sidebarEl);
    }
  }

  function close(sidebarEl: Element) {
    document.body.style.overflow = '';
    removeOverlay();
    sidebarEl.classList.remove('open');
    self.shadowRoot?.querySelector('slot')?.setAttribute('name', 'icon');
  }

  function open(sidebarEl: Element) {
    document.body.style.overflow = 'hidden';
    createOverlay();
    sidebarEl.classList.add('open');
    self.shadowRoot?.querySelector('slot')?.setAttribute('name', 'cross-icon');
  }

  function createOverlay() {
    if (!useOverlay) return;
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.addEventListener('click', onToggle);
    document.body.appendChild(overlay);
  }

  function removeOverlay() {
    if (!useOverlay) return;
    const overlay = document.querySelector('.overlay');
    overlay?.remove();
  }

  effect(() => {
    window.addEventListener('click', onClickDocument);
    window.addEventListener('keydown', onKeyDown);
  });
  cleanup(() => {
    window.removeEventListener('click', onClickDocument);
    window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <button title="Menu" class="menu-btn" onClick={onToggle}>
      <slot name="icon" />
    </button>
  );
}
