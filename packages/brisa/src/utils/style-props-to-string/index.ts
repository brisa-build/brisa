export const lowercase = (str: string) => str.toLowerCase();

export default function stylePropsToString(
  styleProps: JSX.CSSProperties,
): string {
  let res = '';

  for (const key in styleProps) {
    const cssKey = lowercase(key.replace(/([A-Z])/g, '-$1'));
    res += `${cssKey}:${(styleProps as any)[key]};`;
  }

  return res;
}
