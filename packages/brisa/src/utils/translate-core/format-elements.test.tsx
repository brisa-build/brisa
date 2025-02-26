import { describe, expect, it } from 'bun:test';
import formatElements, { tagParsingRegex } from './format-elements';
import renderToString from '../render-to-string';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

describe('utils', () => {
  describe('tagParsingRegex', () => {
    it('should match tags in text', () => {
      const match = 'foo<p>bar</p>baz'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<p>bar</p>');
      expect(match[1]).toBe('p');
      expect(match[2]).toBe('bar');
      expect(match[3]).not.toBeDefined();
    });
    it('should match empty tags', () => {
      const match = 'foo<p></p>baz'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<p></p>');
      expect(match[1]).toBe('p');
      expect(match[2]).toBe('');
      expect(match[3]).not.toBeDefined();
    });
    it('should match self closing tags without spaces', () => {
      const match = 'foo<p/>baz'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<p/>');
      expect(match[1]).not.toBeDefined();
      expect(match[2]).not.toBeDefined();
      expect(match[3]).toBe('p');
    });
    it('should match self closing tags with spaces', () => {
      const match = 'foo<p />baz'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<p />');
      expect(match[1]).not.toBeDefined();
      expect(match[2]).not.toBeDefined();
      expect(match[3]).toBe('p');
    });
    it('should match first occurrence of a tag when input has several', () => {
      const match = 'foo<a>bar</a><b>baz</b>'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<a>bar</a>');
      expect(match[1]).toBe('a');
      expect(match[2]).toBe('bar');
      expect(match[3]).not.toBeDefined();
    });
    it('should match first occurrence of a tag when they are nested', () => {
      const match = 'foo<a>bar<b>baz</b>foobar</a>qux'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<a>bar<b>baz</b>foobar</a>');
      expect(match[1]).toBe('a');
      expect(match[2]).toBe('bar<b>baz</b>foobar');
      expect(match[3]).not.toBeDefined();
    });
    it('should tolerate spaces in regular tags too', () => {
      const match = 'foo<a >bar</a >baz'.match(tagParsingRegex)!;
      expect(match[0]).toBe('<a >bar</a >');
      expect(match[1]).toBe('a');
      expect(match[2]).toBe('bar');
      expect(match[3]).not.toBeDefined();
    });
  });
  describe('formatElements', () => {
    it('should return a string wrapped with a fragment if no elements are passed (SSR)', async () => {
      const output = formatElements('this is a <0>test</0>');

      expect(await renderToString(output as any)).toBe('this is a test');
    });

    it('should return a string wrapped with a fragment if no elements are passed (CLIENT)', async () => {
      const output = formatElements('this is a <0>test</0>');

      await testClientRender(output, 'this is a test');
    });

    it('should return a string wrapped with a string tag', async () => {
      const output = formatElements('this is a <0>test</0>', [<strong />]);
      expect(await renderToString(output as any)).toBe(
        'this is a <strong>test</strong>',
      );
    });

    it('should return a string wrapped multiple tags and defined as object (SSR)', async () => {
      const elements = {
        a: <strong />,
        b: <em />,
        c: <span />,
      };

      const output = formatElements(
        '<a>this is a <b>test</b></a><c>!</c>',
        elements,
      );

      expect(await renderToString(output as any)).toBe(
        '<strong>this is a <em>test</em></strong><span>!</span>',
      );
    });

    it('should return a string wrapped multiple tags and defined as object (Client)', async () => {
      const elements = {
        a: <strong />,
        b: <em />,
        c: <span />,
      };

      const output = formatElements(
        '<a>this is a <b>test</b></a><c>!</c>',
        elements,
      );

      await testClientRender(
        output,
        '<strong>this is a <em>test</em></strong><span>!</span>',
      );
    });

    it('should return a string wrapped multiple tags and defined as array (SSR)', async () => {
      const elements = [<strong />, <em />, <span />];

      const output = formatElements(
        '<0>this is a <1>test</1></0><2>!</2>',
        elements,
      );

      expect(await renderToString(output as any)).toBe(
        '<strong>this is a <em>test</em></strong><span>!</span>',
      );
    });

    it('should return a string wrapped multiple tags and defined as array (Client)', async () => {
      const elements = [<strong />, <em />, <span />];

      const output = formatElements(
        '<0>this is a <1>test</1></0><2>!</2>',
        elements,
      );

      await testClientRender(
        output,
        '<strong>this is a <em>test</em></strong><span>!</span>',
      );
    });
  });
});

async function testClientRender(output: any, expected: string) {
  GlobalRegistrator.register();
  window.__WEB_CONTEXT_PLUGINS__ = false;
  window.__BASE_PATH__ = '';
  window.__TRAILING_SLASH__ = false;
  window.__USE_LOCALE__ = false;
  window.__USE_PAGE_TRANSLATION__ = false;
  window.__ASSET_PREFIX__ = '';
  window.fPath = undefined;
  const brisaElement = (await import('@/utils/brisa-element')).default;
  customElements.define(
    'brisa-element',
    brisaElement(() => output),
  );
  document.body.innerHTML = '<brisa-element></brisa-element>';
  const brisaElementInstance = document.querySelector('brisa-element');
  expect(brisaElementInstance?.shadowRoot?.innerHTML).toBe(expected);
  GlobalRegistrator.unregister();
}
