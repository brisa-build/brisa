export default function stylePropsToString(
  styleProps: JSX.CSSProperties,
): string {
  return Object.entries(styleProps).reduce((acc, [key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    return `${acc}${cssKey}:${value};`;
  }, "");
}
