import type { WebContext } from 'brisa';

export default function MarkdownTabs(
  { label }: { label: string },
  { store, self }: WebContext,
) {
  const tabLabels = Array.from(self.childNodes ?? [])
    .map((node) => (node as HTMLElement)?.getAttribute?.('slot')!)
    .filter(Boolean);

  if (!store.has(label)) store.set(label, tabLabels[0]);

  return (
    <>
      <div class="tablist" role="tablist">
        {tabLabels.map((tabLabel) => (
          <button
            id={`tab-${tabLabel}`}
            key={tabLabel}
            role="tab"
            title={tabLabel}
            aria-label={tabLabel}
            class={tabLabel === store.get(label) ? 'active' : ''}
            aria-selected={tabLabel === store.get(label)}
            tabindex={tabLabel === store.get(label) ? 0 : -1}
            onClick={() => {
              const currentRect = self.getBoundingClientRect();
              const currentScrollY = window.scrollY;

              store.set(label, tabLabel);

              requestAnimationFrame(() => {
                const newRect = self.getBoundingClientRect();
                const scrollDelta = newRect.top - currentRect.top;
                window.scrollTo(0, currentScrollY + scrollDelta);
              });
            }}
          >
            {tabLabel}
          </button>
        ))}
      </div>
      <slot name={store.get(label)} />
    </>
  );
}
