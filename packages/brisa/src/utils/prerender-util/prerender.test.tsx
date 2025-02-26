import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import { __prerender__macro } from './prerender';
import dangerHTML from '../danger-html';

const COMPONENTS = path.join(
  import.meta.dirname,
  '..',
  '..',
  '__fixtures__',
  'components-to-prerender',
);

describe('utils/prerender-util/prerender', () => {
  it('should prerender a component', async () => {
    const comp = (await __prerender__macro({
      componentPath: path.join(COMPONENTS, 'component.tsx'),
      dir: COMPONENTS,
    })) as any;
    expect(comp).toEqual(dangerHTML('<div>Component</div>'));
  });

  it('should prerender a component with props', async () => {
    const comp = (await __prerender__macro({
      componentPath: path.join(COMPONENTS, 'component-with-props.tsx'),
      dir: COMPONENTS,
      componentProps: { name: 'Brisa' },
    })) as any;
    expect(comp).toEqual(dangerHTML('<div>Hello Brisa</div>'));
  });

  it('should prerender a Web Component', async () => {
    const comp = (await __prerender__macro({
      componentPath: 'brisa/server',
      brisaServerPath: path.join(
        import.meta.dirname,
        '..',
        '..',
        'core',
        'server',
      ),
      componentModuleName: 'SSRWebComponent',
      dir: COMPONENTS,
      componentProps: {
        'ssr-Component': path.join(COMPONENTS, 'web-component.tsx'),
        'ssr-selector': 'web-component',
        name: 'Bar',
      },
    })) as any;

    expect(comp).toEqual(
      dangerHTML(
        '<web-component name="Bar"><template shadowrootmode="open"><div>Hello Bar</div></template></web-component>',
      ),
    );
  });
});
