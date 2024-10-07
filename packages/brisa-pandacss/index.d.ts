/**
 * To properly integrate Pandacss , you have to add the following code to
 * your `brisa.config.ts` file:
 *
 * ```ts
 * import pandaCSS from 'brisa-pandacss';
 *
 * export default {
 *  integrations: [pandaCSS()],
 * };
 * ```
 *
 * - [Docs](https://brisa.build/building-your-application/integrations/panda-css#integrating-panda-css)
 */
export default function pandaCSS(): {
    name: string;
    transpileCSS(pathname: string, content: string): Promise<string>;
    defaultCSS: {
      content: string;
      applyDefaultWhenEvery: (content: string) => boolean;
    };
  };
  