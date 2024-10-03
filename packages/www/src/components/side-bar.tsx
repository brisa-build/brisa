import config from '@/config';
import type { Item } from '@/types';
import type { RequestContext } from 'brisa';

export default function SideBar({}, { route }: RequestContext) {
  return (
    <aside class="sidebar">
      <b>Content to learn</b>
      {config.sidebar.map(generateList(undefined, route.pathname))}
    </aside>
  );
}

function generateList(name: string | undefined, pathname: string) {
  return (item: Item) => (
    <details key={item.text} open={isSummaryOpened(item, pathname)} name={name}>
      <summary class={isActive(item, pathname) ? 'active' : ''}>
        {item.link ? (
          <a href={item.link} aria-label={item.text}>
            {item.text}
          </a>
        ) : (
          item.text
        )}
      </summary>
      <ul>
        {item.items?.map((subItem) => (
          <li key={subItem.text}>
            {subItem.items?.length ? (
              generateList(item.text, pathname)(subItem as unknown as Item)
            ) : (
              <a
                class={isActive(subItem, pathname) ? 'active' : ''}
                aria-current={isActive(subItem, pathname) ? true : undefined}
                aria-label={subItem.text}
                href={subItem.link}
              >
                {subItem.text}
              </a>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

function isSummaryOpened(item: Item, pathname: string) {
  return (
    (pathname.startsWith('/getting-started') && item.collapse === false) ||
    Boolean(pathname?.startsWith?.(item.id ?? item.link ?? '-'))
  );
}

function isActive(item: Item, pathname: string) {
  return pathname === item.link;
}
