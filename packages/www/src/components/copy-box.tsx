import { fnToHref } from '@/helpers/fn-to-href';
import CopyIcon from '@/icons/copy-icon';

export default function CopyBox({
  ariaLabel,
  text,
}: {
  ariaLabel: string;
  text: string;
}) {
  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    const link = document.querySelector('.copy-box a') as HTMLElement;
    link.classList.add('success');
    setTimeout(() => link.classList.remove('success'), 1000);
  }

  return (
    <div class="copy-box" title="Copy text">
      <pre>
        <code>
          <span class="shell">$</span> {text}
        </code>
      </pre>
      <a aria-label={ariaLabel} href={fnToHref(copyText, text)}>
        <CopyIcon size={24} />
      </a>
    </div>
  );
}
