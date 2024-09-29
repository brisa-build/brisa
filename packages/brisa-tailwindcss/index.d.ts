export default function brisaTailwindcss(): {
  name: string;
  transpileCSS(pathname: string): Promise<string>;
  defaultCSSContent: string;
};
