import { describe, expect, it } from 'bun:test';
import brisaTailwindcss from '.';

describe('brisa-tailwindcss', () => {
  it('should return the correct name', () => {
    const integration = brisaTailwindcss();
    expect(integration.name).toBe('brisa-tailwindcss');
  });

  it('should return transpileCSS function', () => {
    const integration = brisaTailwindcss();
    expect(integration.transpileCSS).toBeInstanceOf(Function);
  });

  it('should return default CSS content', () => {
    const integration = brisaTailwindcss();
    expect(integration.defaultCSS.content).toContain('@tailwind base;');
    expect(integration.defaultCSS.content).toContain('@tailwind components;');
    expect(integration.defaultCSS.content).toContain('@tailwind utilities;');
  });

  it('should transpile CSS', async () => {
    const cssCode = `
        @tailwind base; 
        @tailwind components; 
        @tailwind utilities;

        :root {
          --color: red;
        }
      `;
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS(
      'out/index.css',
      cssCode,
    );
    expect(transpiledCSS).toContain('@layer base');
  });

  it('should add :host to all :root selectors', async () => {
    const cssCode = `
        @tailwind base; 
        @tailwind components; 
        @tailwind utilities;

        :root {
          --color: red;
        }
      `;
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS(
      'out/index.css',
      cssCode,
    );
    expect(transpiledCSS).toContain(':host');
  });

  it('should not import tailwindcss when @tailwind is not present', async () => {
    const cssCode = `
        body {
          color: red;
        }
      `;
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS(
      'out/index.css',
      cssCode,
    );
    expect(transpiledCSS).not.toContain(
      '@layer base',
    );
  });
});
