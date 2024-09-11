import { describe, expect, it } from 'bun:test';
import formatElements, { tagParsingRegex } from './format-elements';

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
    it('should return a string wrapped with a fragment if no elements are passed', () => {
      const output = formatElements('this is a <0>test</0>');
      const element = output[1] as any;

      expect(output[0]).toBe('this is a ');
      expect(element[0].toString()).toBe('(n)=>i(null,n)');
      expect(element[2]).toBe('test');
    });

    it('should return a string wrapped with a string tag', () => {
      const output = formatElements('this is a <0>test</0>', [<strong />]);
      const element = output[1] as any;

      expect(output[0]).toBe('this is a ');
      expect(element[0]).toBe('strong');
      expect(element[2]).toBe('test');
    });

    it('should return a string wrapped multiple tags and defined as object', () => {
      const elements = {
        a: <strong />,
        b: <em />,
        c: <span />,
      };

      const output = formatElements(
        '<a>this is a <b>test</b></a><c>!</c>',
        elements,
      );
      const elementA = output[0] as any;
      const elementB = elementA[2] as any;
      const elementC = output[1] as any;

      expect(elementA[0]).toBe('strong');
      expect(Array.isArray(elementB)).toBe(true);
      expect(elementB[0]).toBe('this is a ');
      expect(elementB[1][0]?.toString()).toBe('em');
      expect(elementB[1][2]).toBe('test');
      expect(elementC[0]?.toString()).toBe('span');
      expect(elementC[2]).toBe('!');
    });
  });
});
