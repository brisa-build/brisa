export default function ExternalArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path
        fill="currentColor"
        d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z"
      ></path>
    </svg>
  );
}
