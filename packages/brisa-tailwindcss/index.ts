import tailwindcss from '@tailwindcss/postcss';
import fs from 'node:fs';
import postcss from 'postcss';

// Note: is not bundled here to avoid issues with lightningcss
export default function brisaTailwindcss() {
  return {
    name: 'brisa-tailwindcss',
    async transpileCSS(pathname: string) {
      const content = fs.readFileSync(pathname, 'utf-8');
      const transpiledContent = await postcss([tailwindcss]).process(content, {
        from: pathname,
      });
      // Add :host to all :root selectors to support shadow DOM
      return transpiledContent.css.replaceAll(':root', ':root, :host');
    },
    defaultCSSContent:
      '@tailwind base;\n@tailwind components;\n@tailwind utilities;',
  };
}
