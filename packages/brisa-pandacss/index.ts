import pandacss from '@pandacss/dev/postcss';
import postcss from 'postcss';

// Note: is not bundled here to avoid issues with lightningcss
export default function brisaPandacss() {
  return {
    name: 'brisa-pandacss',
    async transpileCSS(pathname: string, content: string) {
      const transpiledContent = await postcss([pandacss]).process(content, {
        from: pathname,
      });
      // Add :host to all :root selectors to support shadow DOM
      return transpiledContent.css.replaceAll(':root', ':root, :host');
    },
    defaultCSS: {
      content: `
       @layer reset, base, tokens, recipes, utilities;
      `,
      applyDefaultWhenEvery: (content: string) => {
        return !content.includes('layer');
      },
    },
  };
}
