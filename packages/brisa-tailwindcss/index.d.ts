/**
 * To properly integrate TailwindCSS, you have to add the following code to
 * your `brisa.config.ts` file:
 *
 * ```ts
 * import tailwindCSS from 'brisa-tailwindcss';
 *
 * export default {
 *  integrations: [tailwindCSS()],
 * };
 * ```
 *
 * - [Docs](https://brisa.build/building-your-application/integrations/tailwind-css#integrating-tailwind-css)
 */
export default function tailwindCSS(): {
  name: string;
  transpileCSS(pathname: string, content: string): Promise<string>;
  defaultCSS: {
    content: string;
    applyDefaultWhenEvery: (content: string) => boolean;
  };
};
