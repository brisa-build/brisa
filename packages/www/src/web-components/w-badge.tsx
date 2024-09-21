import type { WebContext } from 'brisa';

export default function WBadge(
  { type, text }: { type: 'tip' | 'warning' | 'info'; text: string },
  { css }: WebContext,
) {
  css`
    .badge {
      display: inline-block;
      padding: 0.25em 0.5em;
      border-radius: 8px;
      font-size: 0.75em;
      font-weight: bold;
      text-transform: uppercase;
    }

    .tip {
      background-color: #d9edf7;
      color: #2d3e50;
      border: 1px solid #d0e9c6;
    }

    .warning {
      background-color: #fcf8e3;
      color: #8a6d3b;
      border: 1px solid #faebcc;
    }

    .info {
      background-color: #d9edf7;
      color: #31708f;
      border: 1px solid #bce8f1;
    }
  `;
  return <span class={`badge ${type}`}>{text}</span>;
}
