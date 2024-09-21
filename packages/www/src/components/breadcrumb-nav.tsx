import type { RequestContext } from 'brisa';
import config from '@/config';
import type { Item } from '@/types';
import GreaterIcon from '@/icons/greater-icon';
import HeadingsMapPopOver from '@/components/headings-map-popover';
import MenuIcon from '@/icons/menu-icon';

export default function BreadcrumbNav({}, { route }: RequestContext) {
  const { items, next } = getItems(route);
  const lastIndex = items.length - 1;

  return (
    <div class="breadcrumb-wrapper">
      <nav aria-label="Breadcrumb" class="breadcrumb">
        <sidebar-btn>
          <MenuIcon />
        </sidebar-btn>
        <ol>
          {items.map(({ text, link }, index) => (
            <li style={{ display: 'flex', alignItems: 'center' }} key={text}>
              {index > 0 && <GreaterIcon />}
              {link ? (
                <a
                  aria-current={lastIndex === index ? 'page' : undefined}
                  href={link}
                >
                  {text}
                </a>
              ) : (
                text
              )}
            </li>
          ))}
        </ol>

        {next && (
          <div class="next">
            <HeadingsMapPopOver>
              On this page
              <GreaterIcon
                style={{
                  transform: 'rotate(90deg)',
                }}
              />
            </HeadingsMapPopOver>
            <a href={getNextLink(next)}>
              <span>Next</span>
              <GreaterIcon />
            </a>
          </div>
        )}
      </nav>
    </div>
  );
}

function getItems(route: RequestContext['route']) {
  const parts = route.pathname.split('/').filter(Boolean);
  const resultItems: { text: string; link: string | undefined }[] = [];
  let items = config.sidebar as Item[];
  let next;

  for (let i = 0; i < parts.length; i++) {
    const part = '/' + parts.slice(0, i + 1).join('/');
    const itemIndex = items.findIndex(
      (item) => item.id === part || item.link === part,
    );
    const item = items[itemIndex];

    if (items[itemIndex + 1]) {
      next = items[itemIndex + 1];
    }

    if (!item) continue;
    resultItems.push({ text: cleanEmojiFromText(item.text), link: item.link });
    if (!item.items) break;
    items = item.items as Item[];
  }

  return { items: resultItems, next };
}

function getNextLink(next: Item) {
  if (next.link) return next.link;
  if (next.items) return getNextLink(next.items[0]);
}

function cleanEmojiFromText(text: string) {
  let newText = '';

  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 255) continue;
    newText += text[i];
  }

  return newText;
}
