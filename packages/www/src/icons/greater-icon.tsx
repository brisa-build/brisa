export default function GreaterIcon({ size = 24, style = {} }) {
  return (
    <svg
      fill="none"
      height={size}
      width={size}
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
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
