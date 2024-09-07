import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import { __prerender__macro } from './prerender';
import { getConstants } from '@/constants';

const COMPONENTS = path.join(
  import.meta.dirname,
  '..',
  '..',
  '__fixtures__',
  'components-to-prerender',
);

describe('utils/prerender-util/prerender', () => {
  it('should prerender a component', async () => {
    const comp = await __prerender__macro({
      componentPath: path.join(COMPONENTS, 'component.tsx'),
      dir: COMPONENTS,
    });
    expect(comp?.props.html).toBe('<div>Component</div>');
  });

  it('should prerender a component with props', async () => {
    const comp = await __prerender__macro({
      componentPath: path.join(COMPONENTS, 'component-with-props.tsx'),
      dir: COMPONENTS,
      componentProps: { name: 'Brisa' },
    });
    expect(comp?.props.html).toBe('<div>Hello Brisa</div>');
  });

  it('should prerender a Web Component', async () => {
    const comp = await __prerender__macro({
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
        Component: path.join(COMPONENTS, 'web-component.tsx'),
        selector: 'web-component',
        name: 'Bar',
      },
    });

    expect(comp?.props.html).toBe(
      '<web-component name="Bar"><template shadowrootmode="open"><div>Hello Bar</div></template></web-component>',
    );
  });
});
