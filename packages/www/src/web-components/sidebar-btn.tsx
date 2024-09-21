import type { WebContext } from 'brisa';

export default function SideBarBtn(
  { children }: { children: JSX.Element },
  { effect, cleanup }: WebContext,
) {
  effect(() => {
    window.addEventListener('click', onClickDocument);
    window.addEventListener('keydown', onKeyDown);
  });
  cleanup(() => {
    window.removeEventListener('click', onClickDocument);
    window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <button title="Menu" class="sidebar-btn" onClick={onToggle}>
      {children}
    </button>
  );
}

function onClickDocument(e: MouseEvent) {
  const sidebarEl = document.querySelector('.sidebar')!;

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

  const sidebarEl = document.querySelector('.sidebar');

  if (sidebarEl?.classList.contains('open')) close(sidebarEl);
}

function onToggle(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  const sidebarEl = document.querySelector('.sidebar')!;
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
}

function open(sidebarEl: Element) {
  document.body.style.overflow = 'hidden';
  createOverlay();
  sidebarEl.classList.add('open');
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');
  overlay.addEventListener('click', onToggle);
  document.body.appendChild(overlay);
}

function removeOverlay() {
  const overlay = document.querySelector('.overlay');
  overlay?.remove();
}
