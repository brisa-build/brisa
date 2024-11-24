import { describe, expect, it, afterEach, mock } from 'bun:test';
import { normalizeHTML } from '@/helpers';
import { generateEntryPointCode } from '.';
import { getConstants } from '@/constants';

describe('client build -> generateEntryPointCode', () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });
  it('should generate the entrypoint code with the imports and customElements definition', async () => {
    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: false,
    });

    expect(normalizeHTML(res.code)).toBe(
      normalizeHTML(`
        import myComponent from "/path/to/my-component";
        import myComponent2 from "/path/to/my-component2";
        
        const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
        defineElement("my-component", myComponent);
        defineElement("my-component2", myComponent2);
      `),
    );
    expect(res.useWebContextPlugins).toBeFalse();
  });

  it('should generate the entrypoint code with the imports, customElements definition and context provider', async () => {
    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: true,
    });

    const code = normalizeHTML(res.code);

    expect(code).toContain(
      normalizeHTML(`
      brisaElement(ClientContextProvider, ["context", "value", "pid", "cid"]);
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
      import myComponent from "/path/to/my-component";
      import myComponent2 from "/path/to/my-component2";
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
        const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
        defineElement("context-provider", contextProvider);
        defineElement("my-component", myComponent);
        defineElement("my-component2", myComponent2);
      `),
    );
    expect(res.useWebContextPlugins).toBeFalse();
  });

  it('should generate the entrypoint code with the imports, customElements definition and brisa-error-dialog (in dev)', async () => {
    globalThis.mockConstants = {
      ...getConstants(),
      IS_DEVELOPMENT: true,
    };
    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: false,
    });

    const code = normalizeHTML(res.code);

    expect(code).toContain(
      normalizeHTML(`
      import myComponent from "/path/to/my-component";
      import myComponent2 from "/path/to/my-component2";
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
        const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
        defineElement("brisa-error-dialog", brisaErrorDialog);
        defineElement("my-component", myComponent);
        defineElement("my-component2", myComponent2);
      `),
    );

    expect(code).toContain(
      normalizeHTML(`
      var brisaErrorDialog = brisaElement(ErrorDialog);
    `),
    );
    expect(res.useWebContextPlugins).toBeFalse();
  });

  it('should return context provider without any web component', async () => {
    const res = await generateEntryPointCode({
      webComponentsList: {},
      useContextProvider: true,
    });

    expect(normalizeHTML(res.code)).toContain(
      normalizeHTML(`
        brisaElement(ClientContextProvider, ["context", "value", "pid", "cid"]);

        const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
        defineElement("context-provider", contextProvider);
      `),
    );
    expect(res.useWebContextPlugins).toBeFalse();
  });

  it('should return empty when is without context and without any web component', async () => {
    mock.module('/path/to/integrations', () => ({
      webContextPlugins: ['plugin1', 'plugin2'],
    }));
    const res = await generateEntryPointCode({
      webComponentsList: {},
      useContextProvider: false,
      integrationsPath: '/path/to/integrations',
    });

    expect(normalizeHTML(res.code)).toBeEmpty();
    expect(res.useWebContextPlugins).toBeFalse();
  });

  it('should generate the entrypoint code with the imports, customElements definition and webContextPlugins', async () => {
    mock.module('/path/to/integrations', () => ({
      webContextPlugins: ['plugin1', 'plugin2'],
    }));

    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: false,
      integrationsPath: '/path/to/integrations',
    });

    const code = normalizeHTML(res.code);

    expect(code).toBe(
      normalizeHTML(`
      window._P=webContextPlugins;
      import myComponent from "/path/to/my-component";
      import myComponent2 from "/path/to/my-component2";
      import {webContextPlugins} from "/path/to/integrations";
      
      const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
      defineElement("my-component", myComponent);
      defineElement("my-component2", myComponent2);
    `),
    );

    expect(res.useWebContextPlugins).toBeTrue();
  });

  it('should generate the entrypoint code with the imports, customElements definition, context provider and webContextPlugins', async () => {
    mock.module('/path/to/integrations', () => ({
      webContextPlugins: ['plugin1', 'plugin2'],
    }));

    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: true,
      integrationsPath: '/path/to/integrations',
    });

    const code = normalizeHTML(res.code);

    expect(code).toStartWith(
      normalizeHTML(`
      window._P=webContextPlugins;

      import myComponent from "/path/to/my-component";
      import myComponent2 from "/path/to/my-component2";
      import {webContextPlugins} from "/path/to/integrations";
    `),
    );

    expect(code).toContain('function ClientContextProvider');

    expect(code).toEndWith(
      normalizeHTML(`
      const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
      defineElement("context-provider", contextProvider);
      defineElement("my-component", myComponent);
      defineElement("my-component2", myComponent2);
    `),
    );

    expect(res.useWebContextPlugins).toBeTrue();
  });

  it('should generate the entrypoint code with the imports, customElements definition, brisa-error-dialog (in dev) and webContextPlugins', async () => {
    globalThis.mockConstants = {
      ...getConstants(),
      IS_DEVELOPMENT: true,
    };
    mock.module('/path/to/integrations', () => ({
      webContextPlugins: ['plugin1', 'plugin2'],
    }));

    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: false,
      integrationsPath: '/path/to/integrations',
    });

    const code = normalizeHTML(res.code);

    expect(code).toStartWith(
      normalizeHTML(`
      window._P=webContextPlugins;
      import myComponent from "/path/to/my-component";
      import myComponent2 from "/path/to/my-component2";
      import {webContextPlugins} from "/path/to/integrations";
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
        const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
        defineElement("brisa-error-dialog", brisaErrorDialog);
        defineElement("my-component", myComponent);
        defineElement("my-component2", myComponent2);
      `),
    );

    expect(code).toContain(
      normalizeHTML(`
      var brisaErrorDialog = brisaElement(ErrorDialog);
    `),
    );
    expect(res.useWebContextPlugins).toBeTrue();
  });

  it('should generate the entrypoint code with the imports, customElements definition, context provider, brisa-error-dialog (in dev) and webContextPlugins', async () => {
    globalThis.mockConstants = {
      ...getConstants(),
      IS_DEVELOPMENT: true,
    };
    mock.module('/path/to/integrations', () => ({
      webContextPlugins: ['plugin1', 'plugin2'],
    }));

    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: true,
      integrationsPath: '/path/to/integrations',
    });

    const code = normalizeHTML(res.code);

    expect(code).toStartWith(
      normalizeHTML(`
      window._P=webContextPlugins;
      import myComponent from "/path/to/my-component";
      import myComponent2 from "/path/to/my-component2";
      import {webContextPlugins} from "/path/to/integrations";
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
      const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
      
      defineElement("brisa-error-dialog", brisaErrorDialog);
      defineElement("context-provider", contextProvider);
      defineElement("my-component", myComponent);
      defineElement("my-component2", myComponent2);
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
      var brisaErrorDialog = brisaElement(ErrorDialog);
    `),
    );

    expect(code).toContain(
      normalizeHTML(`
      brisaElement(ClientContextProvider, ["context", "value", "pid", "cid"]);
    `),
    );
    expect(res.useWebContextPlugins).toBeTrue();
  });

  it('should generate the entrypoint code with the imports, customElements definition and webContextPlugins with no plugins', async () => {
    mock.module('/path/to/integrations', () => ({
      webContextPlugins: [],
    }));

    const res = await generateEntryPointCode({
      webComponentsList: {
        'my-component': '/path/to/my-component',
        'my-component2': '/path/to/my-component2',
      },
      useContextProvider: false,
      integrationsPath: '/path/to/integrations',
    });

    const code = normalizeHTML(res.code);

    expect(code).toBe(
      normalizeHTML(`
        import myComponent from "/path/to/my-component";
        import myComponent2 from "/path/to/my-component2";

        const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
        
        defineElement("my-component", myComponent);
        defineElement("my-component2", myComponent2);
      `),
    );
    expect(res.useWebContextPlugins).toBeFalse();
  });
});
