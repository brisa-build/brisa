import ExternalArrowIcon from '@/icons/external-arrow-icon';
import type { RequestContext } from 'brisa';

export default function HeadingsBar({}, { route }: RequestContext) {
  return (
    <aside class="right-bar">
      <a
        class="edit"
        href={`https://github.com/brisa-build/brisa/tree/main/docs/${route.pathname}.md`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Edit this page on GitHub <ExternalArrowIcon size={12} />
      </a>
      <b>On this page</b>
      <headings-map skipSSR />
    </aside>
  );
}
