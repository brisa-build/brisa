type Config = {
  embedded?: boolean;
};

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
export default function tailwindCSS(config?: Config): {
  name: string;
  transpileCSS(pathname: string, content: string): Promise<string>;
  defaultCSS: {
    content: string;
    applyDefaultWhenEvery: (content: string) => boolean;
  };
  afterBuild(brisaConstants: BrisaConstants): void | Promise<void>;
};
