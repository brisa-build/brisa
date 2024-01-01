export const lowercase = (str: string) => str.toLowerCase();

export default function stylePropsToString(
  styleProps: JSX.CSSProperties,
): string {
  return Object.entries(styleProps).reduce((acc, [key, value]) => {
    const cssKey = lowercase(key.replace(/([A-Z])/g, "-$1"));
    return `${acc}${cssKey}:${value};`;
  }, "");
}
