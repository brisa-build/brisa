import type { WebContext } from 'brisa';

const HEADER_HEIGHT = 140;

export default async function HeadingsMap(
  {
    popoverTarget,
    popoverTargetAction,
  }: { popoverTarget?: string; popoverTargetAction?: 'show' | 'hide' },
  { state, cleanup, onMount, self }: WebContext,
) {
  let headings = state(
    Array.from(document.querySelectorAll('h2, h3, h4, h5, h6')),
  );
  const top = state<string>('0px');
  const inPopoverClass = popoverTarget ? 'list-inside-popover' : '';

  function updateOutlineMarker() {
    const scrollPosition = window.scrollY + HEADER_HEIGHT;

    for (let i = 0; i < headings.value.length; i++) {
      const heading = headings.value[i];
      const rect = heading.getBoundingClientRect();
      if (
        rect.top + window.scrollY <= scrollPosition &&
        rect.bottom + window.scrollY > scrollPosition
      ) {
        top.value =
          (
            self.shadowRoot?.querySelector(
              `#anchor-to-${heading.id}`,
            ) as HTMLLIElement
          )?.offsetTop + 'px';
        break;
      }
    }
  }

  function updateHeadingsAndOutlineMarker() {
    headings.value = Array.from(
      document.querySelectorAll('h2, h3, h4, h5, h6'),
    );
    updateOutlineMarker();
  }

  onMount(() => {
    window.addEventListener('scroll', updateOutlineMarker);
    window.navigation.addEventListener(
      'navigatesuccess',
      updateHeadingsAndOutlineMarker,
    );
  });
  cleanup(() => {
    window.removeEventListener('scroll', updateOutlineMarker);
    window.navigation.removeEventListener(
      'navigatesuccess',
      updateHeadingsAndOutlineMarker,
    );
  });

  if (headings.value.length === 0) return null;

  return (
    <div class={inPopoverClass} style={{ position: 'relative' }}>
      <div class="outline-marker" style={{ top: top.value }} />
      <ul class="headings-map">
        {headings.value.map((heading) => (
          <li
            id={`anchor-to-${heading.id}`}
            key={heading.id}
            onClick={(e) => {
              top.value = `${e.currentTarget.offsetTop}px`;
              if (popoverTargetAction !== 'hide') return;
              // @ts-ignore
              document.querySelector(`#${popoverTarget}`)?.hidePopover();
            }}
          >
            <a
              aria-label={`Anchor to ${heading.textContent}`}
              href={`#${heading.id}`}
            >
              {heading.textContent}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

declare global {
  interface Window {
    navigation: EventTarget;
  }
}
