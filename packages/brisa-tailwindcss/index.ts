import tailwindcss from '@tailwindcss/postcss';
import postcss from 'postcss';

// Note: is not bundled here to avoid issues with lightningcss
export default function brisaTailwindcss() {
  return {
    name: 'brisa-tailwindcss',
    async transpileCSS(pathname: string, content: string) {
      const transpiledContent = await postcss([tailwindcss]).process(content, {
        from: pathname,
      });
      // Add :host to all :root selectors to support shadow DOM
      return transpiledContent.css.replaceAll(':root', ':root, :host');
    },
    defaultCSS: {
      content: `
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
        @import 'tailwindcss/preflight';
        @import 'tailwindcss/theme';
      `,
      applyDefaultWhenEvery: (content: string) => !content.includes('tailwind'),
    },
  };
}
