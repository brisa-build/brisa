import { describe, expect, it, afterEach } from 'bun:test';
import fs from 'node:fs';
import brisaTailwindcss from '.';

describe('brisa-tailwindcss', () => {
  afterEach(() => {
    if (fs.existsSync('out')) fs.rmSync('out', { recursive: true });
  });

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
    expect(integration.defaultCSSContent).toContain('@tailwind base;');
    expect(integration.defaultCSSContent).toContain('@tailwind components;');
    expect(integration.defaultCSSContent).toContain('@tailwind utilities;');
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
    fs.mkdirSync('out');
    fs.writeFileSync('out/index.css', cssCode);
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS('out/index.css');
    expect(transpiledCSS).toContain(' MIT License | https://tailwindcss.com ');
  });
});
