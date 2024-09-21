export default function GreaterIcon({ size = 24, style = {} }) {
  return (
    <svg
      fill="none"
      height={size}
      width={size}
      shape-rendering="geometricPrecision"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.5"
      viewBox="0 0 24 24"
      style={{
        display: 'inline',
        color: 'currentcolor',
        width: '18px',
        height: '18px',
        ...style,
      }}
    >
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  );
}
